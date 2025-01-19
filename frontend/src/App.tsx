import React from "react"
import { Video } from "./components/Video"
export const App:React.FC = ()=>{
  return(
    <>
      <div className="text-2xl font-bold text-red-800">Hello</div>
      <Video></Video>
    </>
  )
}