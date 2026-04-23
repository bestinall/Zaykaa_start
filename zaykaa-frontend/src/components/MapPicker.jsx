// import React, { useState, useRef } from "react";
// import "leaflet/dist/leaflet.css";
// import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
// import L from "leaflet";

// // Fix marker icon
// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl:
//     "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
//   iconUrl:
//     "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
//   shadowUrl:
//     "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
// });

// const defaultCenter = [12.9716, 77.5946];


// // 🗺️ MAP CLICK → REAL ADDRESS
// const MapClickHandler = ({ setMarker, onLocationSelect }) => {
//   useMapEvents({
//     async click(e) {
//       const { lat, lng } = e.latlng;

//       setMarker([lat, lng]);

//       try {
//         const res = await fetch(
//           `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
//           {
//             headers: {
//               "User-Agent": "zaykaa-app",
//             },
//           }
//         );

//         const data = await res.json();

//         const loc = {
//           lat,
//           lng,
//           address: data.display_name || "Selected location",
//         };

//         onLocationSelect(loc);

//         // 🔥 AUTO CONFIRM
//         if (window.confirmAddress) {
//           window.confirmAddress(loc);
//         }

//       } catch (err) {
//         console.error("Reverse geocode error:", err);

//         const loc = {
//           lat,
//           lng,
//           address: `Lat: ${lat}, Lng: ${lng}`,
//         };

//         onLocationSelect(loc);
//       }
//     },
//   });

//   return null;
// };

// const MapPicker = ({ onLocationSelect }) => {
//   const [marker, setMarker] = useState(defaultCenter);
//   const [query, setQuery] = useState("");
//   const [results, setResults] = useState([]);
//   const debounceRef = useRef(null);

//   // 🔍 SEARCH (debounced + fixed)
//   const handleSearch = (value) => {
//     setQuery(value);

//     if (debounceRef.current) {
//       clearTimeout(debounceRef.current);
//     }

//     debounceRef.current = setTimeout(async () => {
//       if (value.length < 3) {
//         setResults([]);
//         return;
//       }

//       try {
//         const res = await fetch(
//           `https://nominatim.openstreetmap.org/search?format=json&q=${value}`,
//           {
//             headers: {
//               "User-Agent": "zaykaa-app",
//             },
//           }
//         );

//         const data = await res.json();
//         setResults(data);

//       } catch (err) {
//         console.error("Search error:", err);
//       }
//     }, 400);
//   };

//   // 📍 SELECT SUGGESTION
//   const selectPlace = (place) => {
//     const lat = parseFloat(place.lat);
//     const lng = parseFloat(place.lon);

//     const loc = {
//       lat,
//       lng,
//       address: place.display_name,
//     };

//     setMarker([lat, lng]);
//     onLocationSelect(loc);

//     // 🔥 AUTO CONFIRM
//     if (window.confirmAddress) {
//       window.confirmAddress(loc);
//     }
//   };

//   return (
//     <div>
//       {/* SEARCH INPUT */}
//       <input
//         type="text"
//         placeholder="Search address..."
//         value={query}
//         onChange={(e) => handleSearch(e.target.value)}
//         style={{
//           width: "100%",
//           padding: "10px",
//           marginBottom: "8px",
//         }}
//       />

//       {/* SUGGESTIONS */}
//       {results.length > 0 && (
//         <div style={{ maxHeight: "150px", overflowY: "auto" }}>
//           {results.map((place, i) => (
//             <div
//               key={i}
//               onClick={() => selectPlace(place)}
//               style={{
//                 padding: "8px",
//                 cursor: "pointer",
//                 borderBottom: "1px solid #eee",
//               }}
//               onMouseEnter={(e) =>
//                 (e.target.style.background = "#f5f5f5")
//               }
//               onMouseLeave={(e) =>
//                 (e.target.style.background = "white")
//               }
//             >
//               {place.display_name}
//             </div>
//           ))}
//         </div>
//       )}

//       {/* MAP */}
//       <MapContainer
//         center={marker}
//         zoom={16} // 🔥 more accurate
//         style={{
//           height: "400px",
//           width: "100%",
//           marginTop: "10px",
//           borderRadius: "10px",
//         }}
//       >
//         <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
//         <Marker position={marker} />
//         <MapClickHandler
//           setMarker={setMarker}
//           onLocationSelect={onLocationSelect}
//         />
//       </MapContainer>
//     </div>
//   );
// };

// export default MapPicker;
import React, { useState, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";

// Fix marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

const defaultCenter = [12.9716, 77.5946];

// 🗺️ MAP CLICK → REAL ADDRESS
const MapClickHandler = ({ setMarker, onLocationSelect }) => {
  useMapEvents({
    async click(e) {
      const { lat, lng } = e.latlng;

      setMarker([lat, lng]);

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
          {
            headers: { "User-Agent": "zaykaa-app" },
          }
        );

        const data = await res.json();

        const loc = {
          lat,
          lng,
          address: data.display_name || "Selected location",
        };

        onLocationSelect(loc);

        if (window.confirmAddress) {
          window.confirmAddress(loc);
        }
      } catch (err) {
        console.error(err);
      }
    },
  });

  return null;
};

const MapPicker = ({ onLocationSelect }) => {
  const [marker, setMarker] = useState(defaultCenter);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const debounceRef = useRef(null);

  // 📍 CURRENT LOCATION
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setMarker([lat, lng]);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
            {
              headers: { "User-Agent": "zaykaa-app" },
            }
          );

          const data = await res.json();

          const loc = {
            lat,
            lng,
            address: data.display_name || "Your location",
          };

          onLocationSelect(loc);

          if (window.confirmAddress) {
            window.confirmAddress(loc);
          }
        } catch (err) {
          console.error(err);
        }
      },
      () => alert("Allow location access")
    );
  };

  // 🔍 SEARCH
  const handleSearch = (value) => {
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      if (value.length < 3) {
        setResults([]);
        return;
      }

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${value}`,
          {
            headers: { "User-Agent": "zaykaa-app" },
          }
        );

        const data = await res.json();
        setResults(data);
      } catch (err) {
        console.error(err);
      }
    }, 400);
  };

  // 📍 SELECT PLACE
  const selectPlace = (place) => {
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);

    const loc = {
      lat,
      lng,
      address: place.display_name,
    };

    setMarker([lat, lng]);
    onLocationSelect(loc);

    if (window.confirmAddress) {
      window.confirmAddress(loc);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      
      {/* 🔥 FIXED BUTTON (always clickable) */}
      <div style={{ position: "relative", zIndex: 1000 }}>
        <button
          onClick={getCurrentLocation}
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "10px",
            background: "#000",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          📍 Use Current Location
        </button>
      </div>

      {/* SEARCH */}
      <input
        type="text"
        placeholder="Search address..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "8px",
        }}
      />

      {/* SUGGESTIONS */}
      {results.length > 0 && (
        <div
          style={{
            maxHeight: "150px",
            overflowY: "auto",
            background: "#fff",
            position: "relative",
            zIndex: 1000,
          }}
        >
          {results.map((place, i) => (
            <div
              key={i}
              onClick={() => selectPlace(place)}
              style={{
                padding: "8px",
                cursor: "pointer",
                borderBottom: "1px solid #eee",
              }}
            >
              {place.display_name}
            </div>
          ))}
        </div>
      )}

      {/* MAP */}
      <MapContainer
        center={marker}
        zoom={16}
        style={{
          height: "400px",
          width: "100%",
          borderRadius: "10px",
          zIndex: 0,
        }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={marker} />
        <MapClickHandler
          setMarker={setMarker}
          onLocationSelect={onLocationSelect}
        />
      </MapContainer>
    </div>
  );
};

export default MapPicker;   