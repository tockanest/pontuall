import type {AppProps} from 'next/app'
import Layout from "@/components/component/layout"

import "../../public/global.css"
import ThemeProvider from "@/components/component/themeprovider";
import {Toaster} from "@/components/ui/toaster";

export default function App({Component, pageProps}: AppProps) {
    return (
        <>
            <Layout>
                <ThemeProvider/>
                <Component
                    {...pageProps}
                />
                <Toaster/>
            </Layout>
        </>
    )
}