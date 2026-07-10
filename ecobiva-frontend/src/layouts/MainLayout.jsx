import "./MainLayout.css";

import Navbar from "../components/Navbar/Navbar";
import Sidebar from "../components/Sidebar/Sidebar";

import { useLayout } from "../context/LayoutContext";

export default function MainLayout({ children }) {

    const { sidebarOpen } = useLayout();

    return (

        <div className="layout">

            <Sidebar />

            <section
                className={
                    sidebarOpen
                        ? "layoutBody"
                        : "layoutBody expand"
                }
            >

                <Navbar />

                <main>

                    {children}

                </main>

            </section>

        </div>

    );


    return (

        <MainLayout>

            {/* Todo tu contenido */}

            <ClienteModal
                open={abrirModal}
                onClose={() => setAbrirModal(false)}
            />


            <VehiculoModal
                open={abrirModal}
                onClose={() => setAbrirModal(false)}
            />

        </MainLayout>

    );



}