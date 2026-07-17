from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from database import get_db_connection

router = APIRouter()

@router.get("/stores")
async def get_stores() -> List[int]:
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT store_id FROM stores ORDER BY store_id")
        stores = [row[0] for row in cursor.fetchall()]
    finally:
        conn.close()
    return stores

@router.get("/items")
async def get_items() -> List[int]:
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT item_id FROM items ORDER BY item_id")
        items = [row[0] for row in cursor.fetchall()]
    finally:
        conn.close()
    return items

class DatasetInfo(BaseModel):
    rows: int
    columns: int
    missing_values: int
    duplicates: int

@router.get("/dataset-info")
async def get_dataset_info() -> DatasetInfo:
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM sales")
        rows = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM sales WHERE sales IS NULL OR sales = ''")
        missing = cursor.fetchone()[0]
        cursor.execute(
            "SELECT COUNT(*) FROM ("
            "SELECT date, store, item FROM sales GROUP BY date, store, item HAVING COUNT(*) > 1"
            ")"
        )
        duplicates = cursor.fetchone()[0]
    finally:
        conn.close()
    return DatasetInfo(
        rows=rows,
        columns=4,
        missing_values=int(missing),
        duplicates=int(duplicates),
    )

class DataQuality(BaseModel):
    missing_values_pct: float
    duplicate_rows: int
    outliers: int
    data_drift: bool
    freshness: str

@router.get("/quality")
async def get_data_quality() -> DataQuality:
    """Real data-quality statistics computed from the sales table."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM sales")
        total = cursor.fetchone()[0] or 0
        cursor.execute("SELECT COUNT(*) FROM sales WHERE sales IS NULL OR sales = ''")
        missing = cursor.fetchone()[0] or 0
        cursor.execute(
            "SELECT COUNT(*) FROM ("
            "SELECT date, store, item FROM sales GROUP BY date, store, item HAVING COUNT(*) > 1"
            ")"
        )
        duplicates = cursor.fetchone()[0] or 0
        # Outliers: rows where sales deviates > 4 sigmas from the global mean.
        cursor.execute("SELECT AVG(sales), AVG(sales*sales) FROM sales WHERE sales IS NOT NULL")
        mean, mean_sq = cursor.fetchone()
        mean = mean or 0.0
        var = (mean_sq or 0.0) - mean * mean
        std = var ** 0.5 if var and var > 0 else 0.0
        outliers = 0
        if std > 0:
            cursor.execute(
                "SELECT COUNT(*) FROM sales WHERE sales IS NOT NULL "
                "AND ABS(sales - ?) > ? * 4",
                (mean, std),
            )
            outliers = cursor.fetchone()[0] or 0
        # Freshness: days since the most recent sales date.
        cursor.execute("SELECT MAX(date) FROM sales")
        max_date = cursor.fetchone()[0]
        freshness = "No data"
        if max_date:
            try:
                from datetime import datetime
                days = (datetime.now() - datetime.strptime(max_date, "%Y-%m-%d")).days
                freshness = f"{days} days ago"
            except Exception:
                freshness = str(max_date)
    finally:
        conn.close()

    missing_pct = (missing / total * 100.0) if total else 0.0
    data_drift = missing_pct > 5.0 or outliers > total * 0.02
    return DataQuality(
        missing_values_pct=round(missing_pct, 2),
        duplicate_rows=int(duplicates),
        outliers=int(outliers),
        data_drift=bool(data_drift),
        freshness=freshness,
    )

class FeatureDrift(BaseModel):
    feature: str
    training_value: float
    current_value: float
    drift_pct: float
    has_drifted: bool

@router.get("/drift")
async def get_data_drift() -> List[FeatureDrift]:
    """Real drift between the training window (2020-2021) and the most recent
    6 months of sales, measured on aggregate demand statistics."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT AVG(sales), AVG(sales*sales) FROM sales "
            "WHERE date < '2022-01-01' AND sales IS NOT NULL"
        )
        t_mean, t_sq = cursor.fetchone()
        cursor.execute(
            "SELECT AVG(sales), AVG(sales*sales) FROM sales "
            "WHERE date >= '2022-07-01' AND sales IS NOT NULL"
        )
        c_mean, c_sq = cursor.fetchone()
    finally:
        conn.close()

    def _stat(mean, sq):
        mean = mean or 0.0
        var = (sq or 0.0) - mean * mean
        return mean, (var ** 0.5 if var and var > 0 else 0.0)

    t_m, t_s = _stat(t_mean, t_sq)
    c_m, c_s = _stat(c_mean, c_sq)

    def _drift(tr, cu):
        if tr == 0:
            return 0.0
        return round((cu - tr) / abs(tr) * 100.0, 1)

    rows = [
        FeatureDrift(
            feature="Mean Daily Demand",
            training_value=round(t_m, 2),
            current_value=round(c_m, 2),
            drift_pct=_drift(t_m, c_m),
            has_drifted=abs(_drift(t_m, c_m)) > 15.0,
        ),
        FeatureDrift(
            feature="Demand Volatility (Std)",
            training_value=round(t_s, 2),
            current_value=round(c_s, 2),
            drift_pct=_drift(t_s, c_s),
            has_drifted=abs(_drift(t_s, c_s)) > 15.0,
        ),
    ]
    return rows


class DataRow(BaseModel):
    date: str
    store_id: int
    item_id: int
    sales: float

class PaginatedData(BaseModel):
    items: List[DataRow]
    total: int
    page: int
    size: int

@router.get("/raw")
async def get_raw_data(page: int = 1, size: int = 50, store: int = None, item: int = None) -> PaginatedData:
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        query = "SELECT date, store, item, sales FROM sales"
        count_query = "SELECT COUNT(*) FROM sales"
        conditions = []
        params = []
        
        if store is not None:
            conditions.append("store = ?")
            params.append(store)
        if item is not None:
            conditions.append("item = ?")
            params.append(item)
            
        if conditions:
            where_clause = " WHERE " + " AND ".join(conditions)
            query += where_clause
            count_query += where_clause
            
        cursor.execute(count_query, params)
        total = cursor.fetchone()[0]
        
        query += " ORDER BY date DESC, store, item LIMIT ? OFFSET ?"
        params.extend([size, (page - 1) * size])
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        items_list = [
            DataRow(
                date=row['date'],
                store_id=row['store'],
                item_id=row['item'],
                sales=row['sales']
            )
            for row in rows
        ]
    finally:
        conn.close()
        
    return PaginatedData(
        items=items_list,
        total=total,
        page=page,
        size=size
    )


class MonthlySales(BaseModel):
    month: str
    sales: float

class WeeklyPattern(BaseModel):
    day_of_week: str
    avg_sales: float

class SalesResponse(BaseModel):
    monthly: List[MonthlySales]
    weekly: List[WeeklyPattern]

@router.get("/sales/store/{store_id}")
async def get_store_sales(store_id: int) -> SalesResponse:
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT strftime('%Y-%m', date) as month, SUM(sales) as total_sales
            FROM sales
            WHERE store = ?
            GROUP BY month
            ORDER BY month
        """, (store_id,))
        monthly = [MonthlySales(month=row['month'], sales=row['total_sales']) for row in cursor.fetchall()]
        
        cursor.execute("""
            SELECT cast(strftime('%w', date) as integer) as dow, AVG(sales) as avg_sales
            FROM sales
            WHERE store = ?
            GROUP BY dow
            ORDER BY dow
        """, (store_id,))
        
        dow_map = {0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat'}
        weekly = []
        for row in cursor.fetchall():
            dow = row['dow']
            name = dow_map.get(dow, str(dow))
            weekly.append((dow, name, row['avg_sales']))
        
        weekly.sort(key=lambda x: (x[0] - 1) % 7)
        weekly_res = [WeeklyPattern(day_of_week=w[1], avg_sales=w[2]) for w in weekly]
    finally:
        conn.close()
    
    return SalesResponse(monthly=monthly, weekly=weekly_res)

@router.get("/sales/item/{item_id}")
async def get_item_sales(item_id: int) -> SalesResponse:
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT strftime('%Y-%m', date) as month, SUM(sales) as total_sales
            FROM sales
            WHERE item = ?
            GROUP BY month
            ORDER BY month
        """, (item_id,))
        monthly = [MonthlySales(month=row['month'], sales=row['total_sales']) for row in cursor.fetchall()]
        
        cursor.execute("""
            SELECT cast(strftime('%w', date) as integer) as dow, AVG(sales) as avg_sales
            FROM sales
            WHERE item = ?
            GROUP BY dow
            ORDER BY dow
        """, (item_id,))
        
        dow_map = {0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat'}
        weekly = []
        for row in cursor.fetchall():
            dow = row['dow']
            name = dow_map.get(dow, str(dow))
            weekly.append((dow, name, row['avg_sales']))
        
        weekly.sort(key=lambda x: (x[0] - 1) % 7)
        weekly_res = [WeeklyPattern(day_of_week=w[1], avg_sales=w[2]) for w in weekly]
    finally:
        conn.close()
    
    return SalesResponse(monthly=monthly, weekly=weekly_res)
