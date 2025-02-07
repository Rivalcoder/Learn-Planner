"use client"
import { useState } from "react"

export function Checkbox() {
  const [mark,setmark]=useState(false)

    return (
      <input
        type="checkbox"
        checked={mark}
        onChange={(e) =>setmark(!mark)}
        className="w-5 h-5 accent-blue-600 cursor-pointer"
      />
    );
  }
  