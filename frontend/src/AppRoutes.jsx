import {Routes, BrowserRouter, Route} from "react-router";
import Home from "./pages/Home"
import Login from "./pages/Login";
import Register from "./pages/Register";

const AppRoutes = () => {
    Register
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/login" element={<Login/>} />
          <Route path="/register" element={<Register/>} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default AppRoutes;
