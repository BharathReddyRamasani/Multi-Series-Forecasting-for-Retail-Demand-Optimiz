import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { History, Download } from 'lucide-react'

export default function ForecastHistory() {
  const { data, isLoading } = useQuery({
    queryKey: ['history'],
    queryFn: async () => {
      const { data } = await axios.get('http://localhost:8000/api/history')
      return data
    }
  })

  if (isLoading) return <div className="loading-center"><div className="spinner-lg" /></div>

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Forecast History</h1>
          <p className="page-subtitle">Log of all previously generated forecasts and their parameters.</p>
        </div>
      </div>
      <div className="page-body">
        <div className="card">
            <div className="card-header"><span className="card-title"><History size={16}/> Recent Jobs</span></div>
            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Date Run</th>
                            <th>Store</th>
                            <th>Item</th>
                            <th>Model</th>
                            <th>Horizon</th>
                            <th>Expected Demand</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.map((job: any) => (
                            <tr key={job.id}>
                                <td>{new Date(job.date).toLocaleString()}</td>
                                <td>Store #{job.store}</td>
                                <td>Item #{job.item}</td>
                                <td><span className="badge badge-blue">{job.model}</span></td>
                                <td>{job.horizon} Days</td>
                                <td>{Math.round(job.expected_demand).toLocaleString()}</td>
                                <td><button className="btn btn-ghost btn-sm"><Download size={14}/></button></td>
                            </tr>
                        ))}
                        {(!data || data.length === 0) && (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '32px' }} className="text-muted">
                                    No forecast history available. Generate a forecast first.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </>
  )
}
