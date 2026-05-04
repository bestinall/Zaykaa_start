import React, { useEffect, useState } from "react";
import MapPicker from "./MapPicker";

const AddressModal = ({ isOpen, onClose, onConfirm }) => {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    window.confirmAddress = (loc) => {
      setLocation(loc);
      onConfirm(loc);
      onClose();
    };

    return () => {
      window.confirmAddress = null;
    };
  }, [onClose, onConfirm]);

  if (!isOpen) return null;

  return (
    <div style={overlay}>
      <div style={modal}>
        <h3>Select Delivery Address</h3>

        <MapPicker
          onLocationSelect={(loc) => {
            setLocation(loc);
          }}
        />

        {location && (
          <div
            style={{
              marginTop: "10px",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "8px",
              background: "#f5f5f5",
            }}
          >
            <strong>Selected Address:</strong>
            <p style={{ margin: "5px 0 0 0" }}>{location.address}</p>
          </div>
        )}

        <button
          onClick={() => {
            if (!location) {
              alert("Please select location first");
              return;
            }

            onConfirm(location);
            onClose();
          }}
          style={btn}
        >
          Confirm Address
        </button>

        <button onClick={onClose} style={btnSecondary}>
          Close
        </button>
      </div>
    </div>
  );
};

const overlay = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const modal = {
  background: "#fff",
  padding: "20px",
  width: "700px",
  maxHeight: "90vh",
  overflow: "auto",
  borderRadius: "10px",
};

const btn = {
  marginTop: "10px",
  padding: "12px",
  background: "#000",
  color: "#fff",
  border: "none",
  width: "100%",
  borderRadius: "8px",
  cursor: "pointer",
  textAlign: "center",
};

const btnSecondary = {
  marginTop: "10px",
  padding: "10px",
  background: "gray",
  color: "white",
  border: "none",
  width: "100%",
  textAlign: "center",
};

export default AddressModal;
