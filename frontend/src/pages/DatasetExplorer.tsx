import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Database, Download, Search, FileSpreadsheet } from 'lucide-react'

export default function DatasetExplorer() {
  const { data } = useQuery({
    queryKey: ['datasetInfo'],
    queryFn: async () => {
      const { data } = await axios.get('http://localhost:8000/api/data/dataset-info')
      return data
    }
  })

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dataset Explorer</h1>
          <p className="page-subtitle">Inspect the underlying historical sales data used for training.</p>
        </div>
        <button className="btn btn-outline"><Download size={16}/> Export Full CSV</button>
      </div>
      <div className="page-body">
        <div className="grid-4 mb-4">
            <div className="card-kpi blue">
                <div className="card-header"><span className="card-title">Total Rows</span></div>
                <div className="metric-value">{data?.rows?.toLocaleString()}</div>
            </div>
            <div className="card-kpi green">
                <div className="card-header"><span className="card-title">Columns</span></div>
                <div className="metric-value">{data?.columns}</div>
            </div>
            <div className="card-kpi teal">
                <div className="card-header"><span className="card-title">Missing Values</span></div>
                <div className="metric-value">{data?.missing_values}</div>
            </div>
            <div className="card-kpi amber">
                <div className="card-header"><span className="card-title">Duplicates</span></div>
                <div className="metric-value">{data?.duplicates}</div>
            </div>
        </div>
        
        <div className="card">
            <div className="card-header">
                <span className="card-title"><FileSpreadsheet size={16}/> Schema Definition</span>
            </div>
            <div className="table-wrap">
                <table>
                    <thead>
                        <tr><th>Column</th><th>Data Type</th><th>Description</th></tr>
                    </thead>
                    <tbody>
                        <tr><td><code>date</code></td><td>datetime64[ns]</td><td>The date of the sales record</td></tr>
                        <tr><td><code>store_id</code></td><td>int64</td><td>Unique identifier for the store (1-10)</td></tr>
                        <tr><td><code>item_id</code></td><td>int64</td><td>Unique identifier for the item (1-50)</td></tr>
                        <tr><td><code>sales</code></td><td>float64</td><td>Number of items sold</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </>
  )
}
