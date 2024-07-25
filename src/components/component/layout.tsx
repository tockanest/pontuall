// This is the root layout component for your Next.js app.
// Learn more: https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts#root-layout-required
import {Manrope} from 'next/font/google'
import {cn} from '@/lib/utils'

const fontHeading = Manrope({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-heading',
})

const fontBody = Manrope({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-body',
    weight: '400',
})

export default function Layout({children}) {
    return (
        <div
            className={cn(
                'antialiased',
                fontHeading.variable,
                fontBody.variable
            )}
        >
            {children}
        </div>
    )
}