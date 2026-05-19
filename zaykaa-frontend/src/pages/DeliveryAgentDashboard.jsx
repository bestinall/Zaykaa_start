// import React, { useState } from 'react';
// import { motion } from 'framer-motion';
// import { useNavigate } from 'react-router-dom';
// import {
//   Bell,
//   Clock,
//   MapPin,
//   Star,
//   Wallet,
//   Bike,
//   Home,
//   Package,
//   Settings,
//   LogOut,
// } from 'lucide-react';
// import {
//   MapContainer,
//   TileLayer,
//   Marker,
//   Popup,
// } from 'react-leaflet';

// import L from 'leaflet';
// delete L.Icon.Default.prototype._getIconUrl;

// L.Icon.Default.mergeOptions({
//   iconRetinaUrl:
//     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
//   iconUrl:
//     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
//   shadowUrl:
//     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
// });

// const DeliveryAgentDashboard = () => {
//   const navigate = useNavigate();

//   // Earnings State
//   const [earnings, setEarnings] = useState(0);

//   // Orders State
//   const [orders, setOrders] = useState([
//     {
//       id: 1,
//       customer: 'Rahul Sharma',
//       item: 'Paneer Biryani',
//       pickup: 'BTM Layout',
//       drop: 'HSR Layout',
//       amount: '₹320',
//       time: '15 mins',
//       status: 'Pending',
//     },
//     {
//       id: 2,
//       customer: 'Aman Khakre',
//       item: 'Pizza Combo',
//       pickup: 'Koramangala',
//       drop: 'Indiranagar',
//       amount: '₹480',
//       time: '20 mins',
//       status: 'Pending',
//     },
//     {
//       id: 3,
//       customer: 'Priya Singh',
//       item: 'Burger Meal',
//       pickup: 'MG Road',
//       drop: 'Whitefield',
//       amount: '₹250',
//       time: '12 mins',
//       status: 'Pending',
//     },
//   ]);

//   // Accept Order
//   const acceptOrder = (id) => {
//     const updatedOrders = orders.map((order) => {
//       if (order.id === id && order.status === 'Pending') {
//         const amount = Number(
//           order.amount.replace('₹', '')
//         );

//         setEarnings((prev) => prev + amount);

//         return {
//           ...order,
//           status: 'Accepted',
//         };
//       }

//       return order;
//     });

//     setOrders(updatedOrders);
//   };

//   // Logout
//   const handleLogout = () => {
//     localStorage.clear();
//     sessionStorage.clear();

//     navigate('/login', { replace: true });

//     window.location.reload();
//   };

//   return (
//     <div className="flex min-h-screen bg-slate-100">
//       {/* SIDEBAR */}
//       <div className="hidden w-72 flex-col justify-between bg-slate-950 p-6 text-white lg:flex">
//         <div>
//           {/* LOGO */}
//           <div className="flex items-center gap-3">
//             <div className="rounded-2xl bg-orange-500 p-3 shadow-lg">
//               <Bike size={28} />
//             </div>

//             <div>
//               <h1 className="text-2xl font-bold">
//                 Zaykaa Rider
//               </h1>

//               <p className="text-sm text-slate-400">
//                 Delivery Partner
//               </p>
//             </div>
//           </div>

         

//           {/* NAVIGATION */}
//           <div className="mt-10 space-y-3">
//             <SidebarItem
//               icon={<Home />}
//               title="Dashboard"
//               active
//             />

//             <SidebarItem
//               icon={<Package />}
//               title="Orders"
//             />

//             <SidebarItem
//               icon={<Wallet />}
//               title="Earnings"
//             />

//             <SidebarItem
//               icon={<Settings />}
//               title="Settings"
//             />
//           </div>
//         </div>

//         {/* BOTTOM */}
//         <div>
//           {/* Earnings Card */}
//           <div className="rounded-3xl bg-gradient-to-r from-orange-500 to-red-500 p-5 shadow-xl">
//             <p className="text-sm opacity-80">
//               Today's Earnings
//             </p>

//             <h2 className="mt-2 text-4xl font-bold">
//               ₹{earnings}
//             </h2>

//             <p className="mt-2 text-sm">
//               Earnings update automatically
//             </p>
//           </div>

//           {/* Logout Button */}
//           <button
//             onClick={handleLogout}
//             className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/10 py-3 font-semibold text-white transition hover:bg-red-500"
//           >
//             <LogOut size={20} />
//             Logout
//           </button>
//         </div>
//       </div>

//       {/* MAIN CONTENT */}
//       <div className="flex-1 p-6">
//         {/* HEADER */}
//         <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
//           <div>
//             <h1 className="text-4xl font-bold text-slate-900">
//               Delivery Dashboard
//             </h1>

//             <p className="mt-2 text-slate-500">
//               Manage and accept live food deliveries
//             </p>
//           </div>

//           <div className="flex items-center gap-4">
//             <div className="rounded-2xl bg-white p-4 shadow-lg">
//               <Bell className="text-slate-700" />
//             </div>

//             <img
//               src="https://i.pravatar.cc/150"
//               alt="profile"
//               className="h-14 w-14 rounded-full border-4 border-white shadow-lg"
//             />
//           </div>
//         </div>

//         {/* STATS */}
//         <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
//           <StatsCard
//             title="Completed Orders"
//             value="128"
//             color="from-orange-500 to-red-500"
//           />

//           <StatsCard
//             title="Pending Orders"
//             value={
//               orders.filter(
//                 (order) => order.status === 'Pending'
//               ).length
//             }
//             color="from-blue-500 to-cyan-500"
//           />

//           <StatsCard
//             title="Today's Earnings"
//             value={`₹${earnings}`}
//             color="from-green-500 to-emerald-500"
//           />

//           <StatsCard
//             title="Rating"
//             value="4.9 ★"
//             color="from-yellow-500 to-orange-500"
//           />
//         </div>

//         {/* MAIN GRID */}
//         <div className="mt-10 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
//           {/* MAP SECTION */}
//           <div className="overflow-hidden rounded-[2rem] bg-white shadow-xl">
//             <div className="flex items-center justify-between p-6">
//               <div>
//                 <h2 className="text-2xl font-bold text-slate-900">
//                   Live Delivery Map
//                 </h2>

//                 <p className="mt-1 text-slate-500">
//                   Track active rider locations
//                 </p>
//               </div>

//               <div className="rounded-full bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-600">
//                 LIVE
//               </div>
//             </div>
// <div className="h-[420px] w-full">
//   <MapContainer
//     center={[12.9716, 77.5946]}
//     zoom={12}
//     scrollWheelZoom={true}
//     className="h-full w-full"
//   >
//     <TileLayer
//       attribution='&copy; OpenStreetMap contributors'
//       url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//     />

//     {/* Rider Marker */}
//     <Marker position={[12.9716, 77.5946]}>
//       <Popup>
//         Delivery Agent Location
//       </Popup>
//     </Marker>

//     {/* Restaurant Marker */}
//     <Marker position={[12.9352, 77.6245]}>
//       <Popup>
//         Restaurant Pickup
//       </Popup>
//     </Marker>

//     {/* Customer Marker */}
//     <Marker position={[12.926, 77.6762]}>
//       <Popup>
//         Customer Delivery
//       </Popup>
//     </Marker>
//   </MapContainer>
// </div>
            
//           </div>

//           {/* LIVE ORDERS */}
//           <div className="rounded-[2rem] bg-white p-6 shadow-xl">
//             <div className="mb-6 flex items-center justify-between">
//               <div>
//                 <h2 className="text-2xl font-bold text-slate-900">
//                   Live Orders
//                 </h2>

//                 <p className="mt-1 text-slate-500">
//                   Accept nearby deliveries
//                 </p>
//               </div>

//               <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold">
//                 {orders.length} Orders
//               </div>
//             </div>

//             <div className="space-y-5">
//               {orders.map((order) => (
//                 <motion.div
//                   key={order.id}
//                   whileHover={{ scale: 1.02 }}
//                   className="rounded-3xl border border-slate-200 p-5 shadow-sm transition"
//                 >
//                   <div className="flex items-start justify-between">
//                     <div>
//                       <h3 className="text-xl font-bold text-slate-900">
//                         {order.item}
//                       </h3>

//                       <p className="mt-1 text-slate-500">
//                         Customer: {order.customer}
//                       </p>
//                     </div>

//                     <div
//                       className={`rounded-full px-4 py-1 text-sm font-semibold ${
//                         order.status === 'Pending'
//                           ? 'bg-orange-100 text-orange-600'
//                           : 'bg-green-100 text-green-600'
//                       }`}
//                     >
//                       {order.status}
//                     </div>
//                   </div>

//                   <div className="mt-5 space-y-3">
//                     <div className="flex items-center gap-3 text-slate-600">
//                       <MapPin size={18} />

//                       <span>
//                         {order.pickup} → {order.drop}
//                       </span>
//                     </div>

//                     <div className="flex items-center gap-3 text-slate-600">
//                       <Clock size={18} />

//                       <span>{order.time}</span>
//                     </div>

//                     <div className="flex items-center gap-3 text-slate-600">
//                       <Wallet size={18} />

//                       <span>{order.amount}</span>
//                     </div>

//                     <div className="flex items-center gap-3 text-slate-600">
//                       <Star size={18} />

//                       <span>4.8 Customer Rating</span>
//                     </div>
//                   </div>

//                   {order.status === 'Pending' && (
//                     <button
//                       onClick={() => acceptOrder(order.id)}
//                       className="mt-5 w-full rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 py-3 font-semibold text-white shadow-lg transition hover:opacity-90"
//                     >
//                       Accept Order
//                     </button>
//                   )}
//                 </motion.div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// // Sidebar Item
// const SidebarItem = ({ icon, title, active }) => {
//   return (
//     <div
//       className={`flex cursor-pointer items-center gap-4 rounded-2xl px-5 py-4 transition ${
//         active
//           ? 'bg-orange-500 text-white shadow-lg'
//           : 'text-slate-300 hover:bg-white/10'
//       }`}
//     >
//       {icon}

//       <span className="font-medium">
//         {title}
//       </span>
//     </div>
//   );
// };

// // Stats Card
// const StatsCard = ({ title, value, color }) => {
//   return (
//     <motion.div
//       whileHover={{ scale: 1.03 }}
//       className={`rounded-[2rem] bg-gradient-to-r ${color} p-6 text-white shadow-xl`}
//     >
//       <p className="text-sm opacity-80">
//         {title}
//       </p>

//       <h2 className="mt-3 text-4xl font-bold">
//         {value}
//       </h2>
//     </motion.div>
//   );
// };

// export default DeliveryAgentDashboard;
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import {
  Bell,
  Clock,
  MapPin,
  Star,
  Wallet,
  Bike,
  Home,
  Package,
  Settings,
  LogOut,
} from 'lucide-react';

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet';

import L from 'leaflet';

import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

// FIX LEAFLET ICONS
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',

  iconUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',

  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const DeliveryAgentDashboard = () => {
  const navigate = useNavigate();

  // Earnings
  const [earnings, setEarnings] = useState(0);

  // Current Rider Location
  const [currentLocation, setCurrentLocation] =
    useState([12.9716, 77.5946]);

  // Selected Accepted Order
  const [selectedOrder, setSelectedOrder] =
    useState(null);

  // Orders
  const [orders, setOrders] = useState([
    {
      id: 1,
      customer: 'Rahul Sharma',
      item: 'Paneer Biryani',
      pickup: 'BTM Layout',
      drop: 'HSR Layout',

      pickupCoords: [12.9352, 77.6245],
      dropCoords: [12.926, 77.6762],

      amount: '₹320',
      time: '15 mins',
      status: 'Pending',
    },

    {
      id: 2,
      customer: 'Aman Khakre',
      item: 'Pizza Combo',
      pickup: 'Koramangala',
      drop: 'Indiranagar',

      pickupCoords: [12.935, 77.61],
      dropCoords: [12.9784, 77.6408],

      amount: '₹480',
      time: '20 mins',
      status: 'Pending',
    },

    {
      id: 3,
      customer: 'Priya Singh',
      item: 'Burger Meal',
      pickup: 'MG Road',
      drop: 'Whitefield',

      pickupCoords: [12.9756, 77.605],
      dropCoords: [12.9698, 77.75],

      amount: '₹250',
      time: '12 mins',
      status: 'Pending',
    },
  ]);

  // LIVE LOCATION
  useEffect(() => {
    const watchId =
      navigator.geolocation.watchPosition(
        (position) => {
          setCurrentLocation([
            position.coords.latitude,
            position.coords.longitude,
          ]);
        },

        (error) => {
          console.log(error);
        },

        {
          enableHighAccuracy: true,
        }
      );

    return () =>
      navigator.geolocation.clearWatch(watchId);
  }, []);

  // ACCEPT ORDER
  // const acceptOrder = (id) => {
  //   const updatedOrders = orders.map((order) => {
  //     if (order.id === id && order.status === 'Pending') {
  //       const amount = Number(
  //         order.amount.replace('₹', '')
  //       );

  //       setEarnings((prev) => prev + amount);

  //       setSelectedOrder(order);

  //       return {
  //         ...order,
  //         status: 'Accepted',
  //       };
  //     }

  //     return order;
  //   });

  //   setOrders(updatedOrders);
  // };/
  const acceptOrder = (id) => {
  const updatedOrders = orders.map((order) => {
    if (order.id === id && order.status === 'Pending') {
      const amount = Number(
        order.amount.replace('₹', '')
      );

      setEarnings((prev) => prev + amount);

      setSelectedOrder(order);

      return {
        ...order,
        status: 'On The Way',
      };
    }

    return order;
  });

  setOrders(updatedOrders);
};

const deliverOrder = (id) => {
  const updatedOrders = orders.map((order) => {
    if (order.id === id) {
      return {
        ...order,
        status: 'Delivered',
      };
    }

    return order;
  });

  setOrders(updatedOrders);

  // REMOVE ROUTE AFTER DELIVERY
  setSelectedOrder(null);
};

  // LOGOUT
  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();

    navigate('/login', { replace: true });

    window.location.reload();
  };

 const Routing = ({ pickup, drop }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !pickup || !drop) return;

    // REMOVE OLD ROUTES
    map.eachLayer((layer) => {
      if (
        layer?.options?.pane === 'overlayPane' &&
        layer?._route
      ) {
        try {
          map.removeLayer(layer);
        } catch (err) {
          console.log(err);
        }
      }
    });

    // CREATE ROUTE
    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(
          currentLocation[0],
          currentLocation[1]
        ),

        L.latLng(
          pickup[0],
          pickup[1]
        ),

        L.latLng(
          drop[0],
          drop[1]
        ),
      ],

      routeWhileDragging: false,

      addWaypoints: false,

      draggableWaypoints: false,

      fitSelectedRoutes: true,

      show: false,

      createMarker: () => null,

      lineOptions: {
        styles: [
          {
            color: '#ff5a5f',
            weight: 6,
          },
        ],
      },
    }).addTo(map);

    return () => {
      try {
        if (routingControl) {
          routingControl.getPlan().setWaypoints([]);
          map.removeControl(routingControl);
        }
      } catch (err) {
        console.log(err);
      }
    };
  }, [map, pickup, drop]);

  return null;
};
  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* SIDEBAR */}
      <div className="hidden w-72 flex-col justify-between bg-slate-950 p-6 text-white lg:flex">
        <div>
          {/* LOGO */}
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-orange-500 p-3 shadow-lg">
              <Bike size={28} />
            </div>

            <div>
              <h1 className="text-2xl font-bold">
                Zaykaa Rider
              </h1>

              <p className="text-sm text-slate-400">
                Delivery Partner
              </p>
            </div>
          </div>

          {/* NAVIGATION */}
          <div className="mt-10 space-y-3">
            <SidebarItem
              icon={<Home />}
              title="Dashboard"
              active
            />

            <SidebarItem
              icon={<Package />}
              title="Orders"
            />

            <SidebarItem
              icon={<Wallet />}
              title="Earnings"
            />

            <SidebarItem
              icon={<Settings />}
              title="Settings"
            />
          </div>
        </div>

        {/* BOTTOM */}
        <div>
          {/* Earnings */}
          <div className="rounded-3xl bg-gradient-to-r from-orange-500 to-red-500 p-5 shadow-xl">
            <p className="text-sm opacity-80">
              Today's Earnings
            </p>

            <h2 className="mt-2 text-4xl font-bold">
              ₹{earnings}
            </h2>

            <p className="mt-2 text-sm">
              Earnings update automatically
            </p>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/10 py-3 font-semibold text-white transition hover:bg-red-500"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div className="flex-1 p-6">
        {/* HEADER */}
        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">
              Delivery Dashboard
            </h1>

            <p className="mt-2 text-slate-500">
              Manage and accept live food deliveries
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-white p-4 shadow-lg">
              <Bell className="text-slate-700" />
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            title="Completed Orders"
            value="128"
            color="from-orange-500 to-red-500"
          />

          <StatsCard
            title="Pending Orders"
            value={
              orders.filter(
                (order) => order.status === 'Pending'
              ).length
            }
            color="from-blue-500 to-cyan-500"
          />

          <StatsCard
            title="Today's Earnings"
            value={`₹${earnings}`}
            color="from-green-500 to-emerald-500"
          />

          <StatsCard
            title="Rating"
            value="4.9 ★"
            color="from-yellow-500 to-orange-500"
          />
        </div>

        {/* MAIN GRID */}
        <div className="mt-10 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          {/* LIVE MAP */}
          <div className="overflow-hidden rounded-[2rem] bg-white shadow-xl">
            <div className="flex items-center justify-between p-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Live Delivery Map
                </h2>

                <p className="mt-1 text-slate-500">
                  Real-time delivery tracking
                </p>
              </div>

              <div className="rounded-full bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-600">
                LIVE
              </div>
            </div>

            {/* MAP */}
            <div className="h-[500px] w-full">
              <MapContainer
                center={currentLocation}
                zoom={13}
                scrollWheelZoom={true}
                className="h-full w-full"
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* RIDER */}
                <Marker position={currentLocation}>
                  <Popup>
                    Your Live Location
                  </Popup>
                </Marker>

                {/* PICKUP */}
                {selectedOrder && (
                  <Marker
                    position={
                      selectedOrder.pickupCoords
                    }
                  >
                    <Popup>
                      Pickup Location
                    </Popup>
                  </Marker>
                )}

                {/* DROP */}
                {selectedOrder && (
                  <Marker
                    position={
                      selectedOrder.dropCoords
                    }
                  >
                    <Popup>
                      Customer Delivery Location
                    </Popup>
                  </Marker>
                )}

                {/* ROUTE */}
                {selectedOrder && (
                  <Routing
                    pickup={
                      selectedOrder.pickupCoords
                    }
                    drop={
                      selectedOrder.dropCoords
                    }
                  />
                )}
              </MapContainer>
            </div>
          </div>

          {/* LIVE ORDERS */}
          <div className="rounded-[2rem] bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Live Orders
                </h2>

                <p className="mt-1 text-slate-500">
                  Accept nearby deliveries
                </p>
              </div>

              <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold">
                {orders.length} Orders
              </div>
            </div>

            <div className="space-y-5">
              {orders.map((order) => (
                <motion.div
                  key={order.id}
                  whileHover={{ scale: 1.02 }}
                  className="rounded-3xl border border-slate-200 p-5 shadow-sm transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">
                        {order.item}
                      </h3>

                      <p className="mt-1 text-slate-500">
                        Customer: {order.customer}
                      </p>
                    </div>

                    <div
                      className={`rounded-full px-4 py-1 text-sm font-semibold ${
                        order.status === 'Pending'
  ? 'bg-orange-100 text-orange-600'
  : order.status === 'On The Way'
  ? 'bg-blue-100 text-blue-600'
  : 'bg-green-100 text-green-600'
                      }`}
                    >
                      {order.status}
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="flex items-center gap-3 text-slate-600">
                      <MapPin size={18} />

                      <span>
                        {order.pickup} → {order.drop}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-600">
                      <Clock size={18} />

                      <span>{order.time}</span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-600">
                      <Wallet size={18} />

                      <span>{order.amount}</span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-600">
                      <Star size={18} />

                      <span>
                        4.8 Customer Rating
                      </span>
                    </div>
                  </div>

                  {order.status === 'Pending' && (
  <button
    onClick={() => acceptOrder(order.id)}
    className="mt-5 w-full rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 py-3 font-semibold text-white shadow-lg transition hover:opacity-90"
  >
    Accept Order
  </button>
)}

{order.status === 'On The Way' && (
  <button
    onClick={() => deliverOrder(order.id)}
    className="mt-5 w-full rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 py-3 font-semibold text-white shadow-lg transition hover:opacity-90"
  >
    Mark As Delivered
  </button>
)}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// SIDEBAR ITEM
const SidebarItem = ({
  icon,
  title,
  active,
}) => {
  return (
    <div
      className={`flex cursor-pointer items-center gap-4 rounded-2xl px-5 py-4 transition ${
        active
          ? 'bg-orange-500 text-white shadow-lg'
          : 'text-slate-300 hover:bg-white/10'
      }`}
    >
      {icon}

      <span className="font-medium">
        {title}
      </span>
    </div>
  );
};

// STATS CARD
const StatsCard = ({
  title,
  value,
  color,
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className={`rounded-[2rem] bg-gradient-to-r ${color} p-6 text-white shadow-xl`}
    >
      <p className="text-sm opacity-80">
        {title}
      </p>

      <h2 className="mt-3 text-4xl font-bold">
        {value}
      </h2>
    </motion.div>
  );
};

export default DeliveryAgentDashboard;