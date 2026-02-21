import { SignupForm } from "@/components/signup-form"

export default function Page() {
  return (
    <div className='bg-gradient-to-r from-[#cfaad8] via-[#934acb] to-[#48229a] min-h-screen pt-20 flex items-center justify-center'>
      <div className="w-full max-w-sm">
        <SignupForm />
      </div>
    </div>
  )
}
