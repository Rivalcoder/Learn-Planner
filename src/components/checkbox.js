// components/Checkbox.jsx
import { useState } from "react"

export function Checkbox({ checked, onChange }) {


  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="w-5 h-5 accent-blue-600 cursor-pointer"
    />
  );
}
