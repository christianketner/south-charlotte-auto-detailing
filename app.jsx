import { useState, useEffect } from "react";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  addDoc
} from "firebase/firestore";

// Firebase Config — Already included!
const firebaseConfig = {
  apiKey: "AIzaSyAw4GG-Far7Tn7nxvU5IQU31kTugOHva1U",
  authDomain: "south-charlotte-auto-detailing.firebaseapp.com",
  projectId: "south-charlotte-auto-detailing",
  storageBucket: "south-charlotte-auto-detailing.firebasestorage.app",
  messagingSenderId: "1060724811511",
  appId: "1:1060724811511:web:a2b451b916d5b6a73695f2",
  measurementId: "G-2QQV5YJ467"
};

// Initialize Firebase
const app = window.app || initializeApp(firebaseConfig);
window.app = app;

const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    date: "",
    service: ""
  });

  const isAdmin = user?.email === "ketnerchristian@gmail.com";

  // Load jobs from Firestore
  useEffect(() => {
    if (!user) return;
    const fetchJobs = async () => {
      try {
        let q = isAdmin
          ? query(collection(db, "jobs"))
          : query(collection(db, "jobs"), where("userId", "==", user.uid));

        const snapshot = await getDocs(q);
        const fetchedJobs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setJobs(fetchedJobs);
      } catch (error) {
        console.error("Error fetching jobs:", error);
      }
    };
    fetchJobs();
  }, [user]);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.email.split("@")[0]
        });
        setPage("dashboard");
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Login
  const handleLogin = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      alert("Login failed: " + error.message);
    }
  };

  // Register
  const handleRegister = async (name, email, password, address) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      alert("Registration successful!");
      setPage("dashboard");
    } catch (error) {
      alert("Registration failed: " + error.message);
    }
  };

  // Logout
  const handleLogout = async () => {
    await signOut(auth);
    setPage("home");
  };

  // Form change
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Submit booking
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await addDoc(collection(db, "jobs"), {
        ...formData,
        userId: user.uid,
        createdAt: new Date(),
      });

      alert("Thank you for booking! We'll contact you shortly.");
      setBookingModalOpen(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        date: "",
        service: ""
      });
    } catch (error) {
      console.error("Error submitting booking:", error);
      alert("There was an error submitting your booking.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-900">South Charlotte Auto Detailing</h1>
          <nav className="space-x-6 hidden md:flex">
            <a href="#services" className="text-gray-700 hover:text-blue-900 transition">Services</a>
            <a href="#pricing" className="text-gray-700 hover:text-blue-900 transition">Pricing</a>
            <a href="#about" className="text-gray-700 hover:text-blue-900 transition">About</a>
            {user ? (
              <>
                <button onClick={() => setPage("dashboard")} className="text-blue-900 hover:text-blue-800 transition">Dashboard</button>
                <button onClick={handleLogout} className="bg-blue-900 text-white px-5 py-2 rounded-lg hover:bg-blue-800 transition">
                  Logout
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setPage("login")} className="bg-blue-900 text-white px-5 py-2 rounded-lg hover:bg-blue-800 transition">
                  Login
                </button>
                <button onClick={() => setPage("register")} className="bg-yellow-500 text-blue-900 px-5 py-2 rounded-lg hover:bg-yellow-400 transition">
                  Register
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-[60vh] bg-cover bg-center" style={{ backgroundImage: "url('https://placehold.co/1920x1080/1e3a8a/FFFFFF?text=Premium+Auto+Detailing')" }}>
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="text-center text-white max-w-3xl px-4">
            <h2 className="text-4xl sm:text-5xl font-extrabold mb-4">Transform Your Vehicle Today</h2>
            <p className="text-lg sm:text-xl mb-6">We deliver premium auto detailing services that bring out the best in your car.</p>
            <button onClick={() => setBookingModalOpen(true)} className="bg-yellow-500 text-blue-900 px-6 py-3 rounded-md text-lg font-semibold shadow-lg hover:bg-yellow-400 transition">
              Schedule Appointment
            </button>
          </div>
        </div>
      </section>

      {/* Content Pages */}
      {page === "home" && <HomePage />}
      {page === "login" && <LoginPage onLogin={handleLogin} setPage={setPage} />}
      {page === "register" && <RegisterPage onRegister={handleRegister} setPage={setPage} />}
      {page === "dashboard" && <DashboardPage user={user} jobs={jobs} isAdmin={isAdmin} />}
      {bookingModalOpen && (
        <BookingModal
          formData={formData}
          setBookingModalOpen={setBookingModalOpen}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
        />
      )}

      {/* Footer */}
      <footer className="bg-blue-900 text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="text-lg font-bold mb-4">Contact Us</h4>
              <p className="text-gray-300">123 Main Street<br />Charlotte, NC 28202</p>
              <p className="text-gray-300 mt-2">(704) 555-1234</p>
              <p className="text-gray-300">info@southcharlotteautodetailing.com</p>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">Hours</h4>
              <p className="text-gray-300">Monday - Friday: 8am - 6pm</p>
              <p className="text-gray-300">Saturday: 9am - 4pm</p>
              <p className="text-gray-300">Sunday: Closed</p>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">Follow Us</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-yellow-400 hover:text-yellow-300">Facebook</a> 
                <a href="#" className="text-yellow-400 hover:text-yellow-300">Instagram</a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-blue-800 text-center text-gray-400">
            <p>&copy; 2025 South Charlotte Auto Detailing. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function HomePage() {
  return (
    <>
      {/* About Section */}
      <section id="about" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">About Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="rounded-lg overflow-hidden shadow-lg">
              <img src="https://placehold.co/600x400/3b82f6/FFFFFF?text=Detailing+Experts" alt="Our Team" className="w-full h-auto object-cover" />
            </div>
            <div>
              <p className="text-lg text-gray-700 mb-4">
                At South Charlotte Auto Detailing, we combine passion and precision to offer the finest vehicle cleaning and protection services in the area.
              </p>
              <p className="text-lg text-gray-700">
                Whether it’s a quick exterior wash or a full interior restoration, our team ensures every inch of your car is cared for with premium products and expert attention.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services & Pricing */}
      <section id="pricing" className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">Our Pricing</h2>

          {/* Tabs */}
          <div className="flex justify-center mb-10 space-x-4">
            <button className="px-6 py-3 rounded-lg font-medium bg-blue-900 text-white">One-Time Wash</button>
            <button className="px-6 py-3 rounded-lg font-medium bg-white text-blue-900 shadow">Subscription Plans</button>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Basic Wash */}
            <div className="bg-white p-6 rounded-lg shadow-md transform hover:shadow-xl transition duration-300 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Basic Wash</h3>
              <p className="text-gray-600 mb-4">Perfect for regular maintenance and surface cleaning.</p>
              <ul className="text-gray-700 space-y-2 mb-6">
                <li>✔️ Exterior Hand Wash</li>
                <li>✔️ Tire Shine</li>
                <li>✔️ Interior Vacuum</li>
              </ul>
              <div className="text-center">
                <span className="text-2xl font-bold text-blue-900">$45</span>
              </div>
            </div>

            {/* Standard Wash */}
            <div className="bg-white p-6 rounded-lg shadow-md transform hover:shadow-xl transition duration-300 border border-blue-900">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Standard Wash</h3>
              <p className="text-gray-600 mb-4">Includes everything in Basic plus more detailed attention.</p>
              <ul className="text-gray-700 space-y-2 mb-6">
                <li>✔️ Full Exterior Wash</li>
                <li>✔️ Wheel Detailing</li>
                <li>✔️ Glass Cleaning</li>
                <li>✔️ Dashboard Wipe Down</li>
              </ul>
              <div className="text-center">
                <span className="text-2xl font-bold text-blue-900">$75</span>
              </div>
            </div>

            {/* Premium Wash */}
            <div className="bg-white p-6 rounded-lg shadow-md transform hover:shadow-xl transition duration-300 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Premium Wash</h3>
              <p className="text-gray-600 mb-4">Complete detailing package for the ultimate shine.</p>
              <ul className="text-gray-700 space-y-2 mb-6">
                <li>✔️ Deep Interior Clean</li>
                <li>✔️ Upholstery Shampoo</li>
                <li>✔️ Engine Bay Cleaning</li>
                <li>✔️ Paint Protection</li>
              </ul>
              <div className="text-center">
                <span className="text-2xl font-bold text-blue-900">$125</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

// LoginPage Component
function LoginPage({ onLogin, setPage }) {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(formData.email, formData.password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-900">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-blue-900 mb-6 text-center">Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 font-medium mb-1">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 font-medium mb-1">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-900 text-white py-2 rounded-md hover:bg-blue-800 transition"
          >
            Sign In
          </button>
        </form>
        <div className="mt-4 text-center">
          <button onClick={() => setPage("register")} className="text-blue-900 hover:underline">Don't have an account? Register</button>
        </div>
      </div>
    </div>
  );
}

// RegisterPage Component
function RegisterPage({ onRegister, setPage }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    address: "",
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onRegister(formData.name, formData.email, formData.password, formData.address);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-900">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-blue-900 mb-6 text-center">Create Account</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700 font-medium mb-1">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 font-medium mb-1">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-700 font-medium mb-1">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="address" className="block text-gray-700 font-medium mb-1">Home Address</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              required
              placeholder="Your house address"
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-900 text-white py-2 rounded-md hover:bg-blue-800 transition"
          >
            Register
          </button>
        </form>
        <div className="mt-4 text-center">
          <button onClick={() => setPage("login")} className="text-blue-900 hover:underline">Already have an account? Log in</button>
        </div>
      </div>
    </div>
  );
}

// DashboardPage Component
function DashboardPage({ user, jobs }) {
  return (
    <div className="py-16 bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h2>
        <div className="bg-white p-6 rounded-lg shadow-md mb-10">
          <h3 className="text-xl font-bold text-blue-900 mb-4">Welcome, {user?.displayName}</h3>
          <p className="text-gray-700 mb-6">Here you can view and manage upcoming appointments.</p>
        </div>

        <h3 className="text-2xl font-bold text-gray-900 mb-4">Upcoming Jobs</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-sm">
            <thead className="bg-blue-900 text-white">
              <tr>
                <th className="py-3 px-4 text-left">Customer</th>
                <th className="py-3 px-4 text-left">Service</th>
                <th className="py-3 px-4 text-left">Date</th>
                <th className="py-3 px-4 text-left">Address</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 ? (
                <tr><td colSpan="4" className="py-4 px-4 text-center">No upcoming jobs yet.</td></tr>
              ) : (
                jobs.map((job, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{job.name}</td>
                    <td className="py-3 px-4">{job.service}</td>
                    <td className="py-3 px-4">{new Date(job.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4">{job.address}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Booking Modal
function BookingModal({ formData, setBookingModalOpen, handleInputChange, handleSubmit }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md relative">
        <button
          onClick={() => setBookingModalOpen(false)}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Book Your Appointment</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700 font-medium mb-1">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 font-medium mb-1">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="phone" className="block text-gray-700 font-medium mb-1">Phone</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="address" className="block text-gray-700 font-medium mb-1">Address</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              required
              placeholder="Your house address"
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="date" className="block text-gray-700 font-medium mb-1">Preferred Date</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="service" className="block text-gray-700 font-medium mb-1">Service</label>
            <select
              id="service"
              name="service"
              value={formData.service}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 rounded-md p-2"
            >
              <option value="">Select a service</option>
              <option value="Basic Wash">Basic Wash ($45)</option>
              <option value="Standard Wash">Standard Wash ($75)</option>
              <option value="Premium Wash">Premium Wash ($125)</option>
              <option value="Monthly Subscription">Monthly Subscription ($99)</option>
              <option value="Biweekly Subscription">Biweekly Subscription ($189)</option>
              <option value="Weekly Subscription">Weekly Subscription ($359)</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-900 text-white py-2 rounded-md hover:bg-blue-800 transition"
          >
            Submit Booking
          </button>
        </form>
      </div>
    </div>
  );
}