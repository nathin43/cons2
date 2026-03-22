/* ===============================================
   LOADING COMPONENT - USAGE EXAMPLES
   Modern Professional Dashboard Loader
   =============================================== */

import { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import Loading from "../../components/Loading";
import API from "../../services/api";
import "./AdminDashboard.css";

/* ===============================================
   EXAMPLE 1: Basic Usage
   Simple loading state with default settings
   =============================================== */
const DashboardExample1 = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/admin/dashboard");
      setData(data);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      // Smooth transition - wait for animation to complete
      setTimeout(() => setLoading(false), 500);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <AdminLayout>
      <div className="dashboard-content fade-in">
        {/* Your dashboard content here */}
        <h1>Dashboard</h1>
        {/* ... rest of your components ... */}
      </div>
    </AdminLayout>
  );
};

/* ===============================================
   EXAMPLE 2: With Progress Bar
   Loading with progress indicator
   =============================================== */
const DashboardExample2 = () => {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setProgress(0);

    try {
      // Simulate progressive loading
      setProgress(20);
      const { data: statsData } = await API.get("/admin/dashboard");
      
      setProgress(60);
      const { data: ordersData } = await API.get("/admin/orders/recent");
      
      setProgress(90);
      setData({ stats: statsData, orders: ordersData });
      
      setProgress(100);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  if (loading) {
    return (
      <Loading 
        showProgress={true} 
        progress={progress}
        showSkeletonCards={true}
      />
    );
  }

  return (
    <AdminLayout>
      <div className="dashboard-content fade-in">
        {/* Your dashboard content */}
      </div>
    </AdminLayout>
  );
};

/* ===============================================
   EXAMPLE 3: Smooth Fade-in Transition
   Best practice with CSS transitions
   =============================================== */
const DashboardExample3 = () => {
  const [loading, setLoading] = useState(true);
  const [fadeIn, setFadeIn] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setFadeIn(false);

    try {
      const { data } = await API.get("/admin/dashboard");
      setData(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      // Start fade-in animation
      setTimeout(() => {
        setLoading(false);
        setTimeout(() => setFadeIn(true), 50);
      }, 500);
    }
  };

  if (loading) {
    return <Loading showProgress={true} showSkeletonCards={true} />;
  }

  return (
    <AdminLayout>
      <div className={`dashboard-content ${fadeIn ? 'fade-in' : 'fade-out'}`}>
        {/* Your dashboard content */}
        <header className="dashboard-header">
          <h1>Welcome back, Admin!</h1>
          <p>Here's what's happening today</p>
        </header>

        <div className="dashboard-stats">
          {/* Stats cards */}
        </div>

        <div className="dashboard-charts">
          {/* Charts and graphs */}
        </div>
      </div>
    </AdminLayout>
  );
};

/* ===============================================
   EXAMPLE 4: Integration with Current AdminDashboard
   Drop-in replacement for existing loading state
   =============================================== */
const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/admin/dashboard");
      if (data.success) {
        setStats(data.stats);
        // ... set other state
      }
    } catch (err) {
      console.error("Dashboard error:", err);
      setError("Failed to load dashboard data.");
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  // Replace the old loading block with the new Loading component
  if (loading && !stats) {
    return (
      <AdminLayout>
        <Loading 
          showProgress={false}
          showSkeletonCards={true}
        />
      </AdminLayout>
    );
  }

  if (error && !stats) {
    return (
      <AdminLayout>
        <div className="dashboard-error">
          <h2>Oops! Something went wrong</h2>
          <p>{error}</p>
          <button onClick={() => fetchDashboard()}>Try Again</button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="dash-content fade-in">
        {/* Your existing dashboard content */}
        <section className="dash-welcome">
          <h1>Welcome back, Admin</h1>
        </section>
        {/* ... rest of dashboard ... */}
      </div>
    </AdminLayout>
  );
};

/* ===============================================
   ADDITIONAL CSS FOR FADE-IN TRANSITION
   Add this to your AdminDashboard.css
   =============================================== */

/*
.fade-in {
  animation: fadeInContent 0.6s ease-in-out forwards;
}

.fade-out {
  opacity: 0;
}

@keyframes fadeInContent {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
*/

export default AdminDashboard;
