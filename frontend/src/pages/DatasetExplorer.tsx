import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import { Download, FileSpreadsheet, ChevronLeft, ChevronRight, Search } from 'lucide-react'

export default function DatasetExplorer() {
  const [page, setPage] = useState(1)
  const size = 15

  const { data: info } = useQuery({
    queryKey: ['datasetInfo'],
    queryFn: apiClient.getDatasetInfo
  })

  const { data: rawData, isLoading } = useQuery({
    queryKey: ['raw_data', page, size],
    queryFn: () => apiClient.getRawData(page, size)
  })

  const { data: quality } = useQuery({
    queryKey: ['data-quality'],
    queryFn: apiClient.getQuality
  })
  
  const { data: drift } = useQuery({
    queryKey: ['data-drift'],
    queryFn: apiClient.getDrift
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
        {/* Data Quality Monitor */}
        <div className="card mb-4" style={{ border: '1px solid var(--purple-bdr)' }}>
          <div className="card-header">
             <span className="card-title text-purple">Dataset Quality Monitor</span>
          </div>
          <div className="grid-5" style={{ padding: '0 16px 16px' }}>
              <div className="card-kpi blue" style={{ background: 'transparent', border: 'none', padding: 8 }}>
                  <div className="card-header" style={{ padding: 0 }}><span className="card-title">Missing Values</span></div>
                  <div className="metric-value">{quality?.missing_values_pct}%</div>
              </div>
              <div className="card-kpi green" style={{ background: 'transparent', border: 'none', padding: 8 }}>
                  <div className="card-header" style={{ padding: 0 }}><span className="card-title">Duplicate Rows</span></div>
                  <div className="metric-value">{quality?.duplicate_rows}</div>
              </div>
              <div className="card-kpi amber" style={{ background: 'transparent', border: 'none', padding: 8 }}>
                  <div className="card-header" style={{ padding: 0 }}><span className="card-title">Outliers</span></div>
                  <div className="metric-value">{quality?.outliers}</div>
              </div>
              <div className="card-kpi rose" style={{ background: 'transparent', border: 'none', padding: 8 }}>
                  <div className="card-header" style={{ padding: 0 }}><span className="card-title">Data Drift</span></div>
                  <div className="metric-value">{quality?.data_drift ? 'Yes' : 'No'}</div>
              </div>
              <div className="card-kpi teal" style={{ background: 'transparent', border: 'none', padding: 8 }}>
                  <div className="card-header" style={{ padding: 0 }}><span className="card-title">Freshness</span></div>
                  <div className="metric-value" style={{ fontSize: 18 }}>{quality?.freshness}</div>
              </div>
          </div>
        </div>
        
        {/* Feature Drift Detection */}
        <div className="card mb-4">
          <div className="card-header">
            <span className="card-title">Feature Drift Detection</span>
          </div>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Training Value</th>
                  <th>Current Value</th>
                  <th>Drift</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {drift?.map((d, i) => (
                  <tr key={i}>
                    <td>{d.feature}</td>
                    <td>{d.training_value}</td>
                    <td>{d.current_value}</td>
                    <td style={{ color: d.has_drifted ? 'var(--rose)' : 'var(--tx-1)' }}>{d.drift_pct > 0 ? '+' : ''}{d.drift_pct}%</td>
                    <td>
                      {d.has_drifted ? 
                        <span className="badge rose">⚠ Drift Detected</span> : 
                        <span className="badge green">Stable</span>}
                    </td>
                  </tr>
                ))}
                {!drift && <tr><td colSpan={5} style={{textAlign: 'center', padding: 20}}>Loading drift analysis...</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Data Grid */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 600 }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="card-title"><FileSpreadsheet size={16}/> Raw Data View</span>
                <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: 'var(--bg)', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <Search size={14} style={{ color: 'var(--tx-3)', marginRight: 8 }} />
                    <input type="text" placeholder="Filter disabled in demo..." disabled style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--tx-1)', fontSize: 13 }} />
                </div>
            </div>
            
            <div className="table-wrap" style={{ flex: 1 }}>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Store ID</th>
                            <th>Item ID</th>
                            <th style={{ textAlign: 'right' }}>Sales Qty</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--tx-3)' }}>Loading data...</td></tr>
                        ) : rawData?.items?.map((row: any, i: number) => (
                            <tr key={i}>
                                <td style={{ color: 'var(--tx-2)' }}>{row.date.split('T')[0]}</td>
                                <td><span style={{ padding: '2px 8px', background: 'var(--surface-2)', borderRadius: 100, fontSize: 12 }}>Store #{row.store_id}</span></td>
                                <td><span style={{ padding: '2px 8px', background: 'var(--surface-2)', borderRadius: 100, fontSize: 12 }}>Item #{row.item_id}</span></td>
                                <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--blue)' }}>{row.sales.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {/* Pagination */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 13, color: 'var(--tx-3)' }}>
                    Showing {((page - 1) * size) + 1} to {Math.min(page * size, rawData?.total || 0)} of {rawData?.total?.toLocaleString()} entries
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                        className="btn btn-outline" 
                        style={{ padding: '6px 12px' }}
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                    >
                        <ChevronLeft size={16} /> Prev
                    </button>
                    <button 
                        className="btn btn-outline" 
                        style={{ padding: '6px 12px' }}
                        disabled={!rawData || page * size >= rawData.total}
                        onClick={() => setPage(p => p + 1)}
                    >
                        Next <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
      </div>
    </>
  )
}
