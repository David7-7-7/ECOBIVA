import "./MainLayout.css";

import { Outlet } from "react-router-dom";

import Navbar from "../components/Navbar/Navbar";
import Sidebar from "../components/Sidebar/Sidebar";

import { useLayout } from "../context/LayoutContext";

export default function MainLayout() {

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

                    <Outlet />

                </main>

            </section>

        </div>

    );

}