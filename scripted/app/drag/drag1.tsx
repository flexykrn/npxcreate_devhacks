"use client"

import { motion } from "motion/react"

export default function Drag1() {
    return <motion.div drag style={box} />
}


const box = {
    width: 500,
    height: 200,
    backgroundColor: "#dd00ee",
    borderRadius: 10,
}