import { Button } from "@/components/ui/button"
import Link from "next/link";

export default function Page() {
  return (
  
    <div className='bg-gradient-to-r from-[#cfaad8] via-[#934acb] to-[#48229a] min-h-screen'>
      this is the home page
    <h1 className="scroll-m-20 text-center text-6xl font-extrabold tracking-tight text-balance mt-40">
      Welcome to <span className="text-purple-100">ScriptED</span>🚀
    </h1>
     <h1 className="scroll-m-20 text-center text-4xl font-bold tracking-tight text-balance mt-6">
      Where Ideas Become Scripts
    </h1> 
   

<Button
  asChild
  variant="link"
  className="text-4xl rounded-3xl border-2 border-black flex items-center justify-self-center mt-12 p-8 transition-all duration-300 hover:bg-gradient-to-r hover:from-[#cfaad8] hover:via-[#934acb] hover:to-[#48229a] hover:text-white hover:border-transparent hover:shadow-lg hover:shadow-purple-500/30"
>
  <Link href="/main">Get Started</Link>
</Button>

     </div>
   
  )
}

