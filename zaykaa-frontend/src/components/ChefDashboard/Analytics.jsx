import React from 'react';

const Analytics = ({ data }) => {
  if (!data) return <div>Loading analytics...</div>;

  const averageBookingValue = data.totalBookings
    ? Math.round(data.totalEarnings / data.totalBookings)
    : 0;
  const successRate = data.totalBookings
    ? Math.round((data.completedBookings / data.totalBookings) * 100)
    : 0;

  return (
    <div className="analytics-section">
      <h2>ðŸ“Š Your Performance</h2>

      <div className="analytics-grid">
        <div className="analytics-card">
          <div className="card-icon">ðŸ“…</div>
          <div className="card-content">
            <h3>{data.totalBookings}</h3>
            <p>Total Bookings</p>
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-icon">âœ“</div>
          <div className="card-content">
            <h3>{data.completedBookings}</h3>
            <p>Completed Bookings</p>
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-icon">â³</div>
          <div className="card-content">
            <h3>{data.upcomingBookings}</h3>
            <p>Upcoming Bookings</p>
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-icon">â­</div>
          <div className="card-content">
            <h3>{data.averageRating}</h3>
            <p>Average Rating ({data.totalReviews} reviews)</p>
          </div>
        </div>

        <div className="analytics-card highlight">
          <div className="card-icon">ðŸ’°</div>
          <div className="card-content">
            <h3>â‚¹{data.totalEarnings}</h3>
            <p>Total Earnings</p>
          </div>
        </div>
      </div>

      <div className="earnings-summary">
        <h3>Earnings Summary</h3>
        <div className="summary-details">
          <p>ðŸ’µ This Month: â‚¹{data.totalEarnings}</p>
          <p>ðŸ“ˆ Average Booking Value: â‚¹{averageBookingValue}</p>
          <p>âœ“ Success Rate: {successRate}%</p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
