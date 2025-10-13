"use client";
import {Skeleton} from "./ui/skeleton"
export default function LoginFormSkeleton() {
  return (
    <div className={"flex flex-col gap-6"}>
      <div className='flex flex-col items-center gap-2 text-center'>
        <h1 className='text-4xl font-bold'>Welcome Back!</h1>
        <p className='text-muted-foreground text-sm text-balance'>
          Choose your preferred method to continue.
        </p>
      </div>
      <div className='grid gap-6'>
        <Skeleton className='w-full h-10' />
        <Skeleton className='w-full h-10' />
        <Skeleton className='w-full h-10' />
        <div className='after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t'>
          <span className='bg-background text-muted-foreground relative z-10 px-2'>
            Or continue with
          </span>
        </div>
        <Skeleton className='w-full h-10' />
      </div>
    </div>
  );
}
