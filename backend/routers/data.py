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
    finally:
        conn.close()
    return DatasetInfo(
        rows=rows,
        columns=4,
        missing_values=0,
        duplicates=0
    )

class DataQuality(BaseModel):
    missing_values_pct: float
    duplicate_rows: int
    outliers: int
    data_drift: bool
    freshness: str

@router.get("/quality")
async def get_data_quality() -> DataQuality:
    return DataQuality(
        missing_values_pct=0.0,
        duplicate_rows=0,
        outliers=18,
        data_drift=False,
        freshness="Updated Today"
    )

class FeatureDrift(BaseModel):
    feature: str
    training_value: float
    current_value: float
    drift_pct: float
    has_drifted: bool

@router.get("/drift")
async def get_data_drift() -> List[FeatureDrift]:
    return [
        FeatureDrift(
            feature="Rolling Mean",
            training_value=42.0,
            current_value=51.0,
            drift_pct=18.0,
            has_drifted=True
        ),
        FeatureDrift(
            feature="Lag 7",
            training_value=35.0,
            current_value=36.0,
            drift_pct=2.8,
            has_drifted=False
        ),
        FeatureDrift(
            feature="Weekend Demand",
            training_value=60.0,
            current_value=58.0,
            drift_pct=-3.3,
            has_drifted=False
        )
    ]


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
