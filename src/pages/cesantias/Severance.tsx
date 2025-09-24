import { useState, useEffect } from "react";
import Modal from "react-modal";
import { obtenerSolicitudesCesantias, solicitarCesantias } from "../../services/cesantiasService";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { User as UserIcon } from "lucide-react";
import Loader from '../../components/Loader';

Modal.setAppElement("#root");

const CesantiasRequest = () => {
  const [tab, setTab] = useState<"misSolicitudes" | "historial">("misSolicitudes");
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [loading, setLoading] = useState(false);

  const [montoSolicitado, setMontoSolicitado] = useState("");
  const [motivo, setMotivo] = useState("");
  const user = JSON.parse(localStorage.getItem("usuario") || "null");

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const cargarSolicitudes = async () => {
    try {
      setLoading(true);
      const data = await obtenerSolicitudesCesantias();
      setSolicitudes(data);
    } catch (error) {
      toast.error("Error al cargar solicitudes");
    } finally {
      setLoading(false);
    }
  };

  const manejarSolicitudCesantias = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!montoSolicitado || !motivo) {
      toast.error("Todos los campos son obligatorios");
      return;
    }

    try {
      await solicitarCesantias({ monto: montoSolicitado, motivo });
      toast.success("Solicitud enviada correctamente");
      setModalAbierto(false);
      cargarSolicitudes();
    } catch (error) {
      toast.error("Error al enviar la solicitud");
    }
  };

  if (loading) {
    return <Loader text="Cargando cesantías..." />;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      {/* Pestañas */}
      <div className="flex space-x-4 mb-4 border-b pb-2">
        <button
          className={`px-4 py-2 ${tab === "misSolicitudes" ? "border-b-2 border-blue-500 font-bold" : ""}`}
          onClick={() => setTab("misSolicitudes")}
        >
          Mis Solicitudes
        </button>
        <button
          className={`px-4 py-2 ${tab === "historial" ? "border-b-2 border-blue-500 font-bold" : ""}`}
          onClick={() => setTab("historial")}
        >
          Historial de Solicitudes
        </button>
      </div>

      {/* Contenido de pestañas */}
      {tab === "misSolicitudes" && (
        <div>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
            onClick={() => setModalAbierto(true)}
          >
            + Nueva Solicitud
          </button>

          {/* Tabla de solicitudes */}
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">Monto Solicitado</th>
                <th className="border p-2">Motivo</th>
                <th className="border p-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {solicitudes.map((solicitud) => (
                <tr key={solicitud.id} className="border">
                  <td className="p-2">${solicitud.monto}</td>
                  <td className="p-2">{solicitud.motivo}</td>
                  <td className="p-2">{solicitud.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "historial" && <p>Historial de solicitudes (aún no implementado)</p>}

      {/* Modal para solicitar cesantías */}
      <Modal isOpen={modalAbierto} onRequestClose={() => setModalAbierto(false)} className="modal">
        <div className="p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">Nueva Solicitud de Cesantías</h2>
          <form onSubmit={manejarSolicitudCesantias}>
            <div className="mb-4">
              <label className="block font-medium">Monto Solicitado</label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                value={montoSolicitado}
                onChange={(e) => setMontoSolicitado(e.target.value)}
                placeholder="Ingrese el monto"
              />
            </div>

            <div className="mb-4">
              <label className="block font-medium">Motivo</label>
              <textarea
                className="w-full p-2 border rounded"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Explica el motivo"
              />
            </div>

            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
              Enviar Solicitud
            </button>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default CesantiasRequest;