import React, { useState } from "react";
import AddressModal from "../components/AddressModal";

const Checkout = () => {
  const [showMap, setShowMap] = useState(false);
  const [address, setAddress] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-start p-6">
      
      {/* CARD */}
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 space-y-5">

        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          Checkout
        </h2>

        {/* BUTTON */}
        <button
          onClick={() => setShowMap(true)}
          className="w-full py-3 border border-dashed rounded-lg text-sm 
          text-gray-600 dark:text-gray-300 
          hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          {address ? "Change Address" : "Select Delivery Address"}
        </button>

        {/* ADDRESS DISPLAY */}
        {address && (
          <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600">
            <p className="text-sm font-medium text-gray-800 dark:text-white">
              Delivering to:
            </p>
            <p className="text-sm mt-1 text-gray-600 dark:text-gray-300">
              📍 {address.address}
            </p>
          </div>
        )}

      </div>

      {/* MAP MODAL */}
      <AddressModal
        isOpen={showMap}
        onClose={() => setShowMap(false)}
        onConfirm={(loc) => {
          console.log("Selected:", loc);
          setAddress(loc);
          setShowMap(false);
        }}
      />
    </div>
  );
};

export default Checkout;