import { useState, useEffect } from "react";
import Modal from "react-modal";
import { obtenerSolicitudesVacaciones, solicitarVacaciones } from "../../services/vacacionesService";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { User as UserIcon } from "lucide-react";
import Loader from '../../components/Loader';

Modal.setAppElement("#root");

const Vacaciones = () => {
  const [tab, setTab] = useState<"misSolicitudes" | "historial">("misSolicitudes");
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [loading, setLoading] = useState(false);

  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [diasSolicitados, setDiasSolicitados] = useState(0);
  const [motivo, setMotivo] = useState("");
  const user = JSON.parse(localStorage.getItem("usuario") || "null");

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const cargarSolicitudes = async () => {
    try {
      setLoading(true);
      const data = await obtenerSolicitudesVacaciones();
      setSolicitudes(data);
    } catch (error) {
      toast.error("Error al cargar las solicitudes de vacaciones");
    } finally {
      setLoading(false);
    }
  };

  const manejarSolicitudVacaciones = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fechaInicio || !fechaFin || diasSolicitados <= 0 || !motivo) {
      toast.error("Todos los campos son obligatorios");
      return;
    }

    try {
      await solicitarVacaciones({ fechaInicio, fechaFin, diasSolicitados, motivo });
      toast.success("Solicitud enviada correctamente");
      setModalAbierto(false);
      cargarSolicitudes();
    } catch (error) {
      toast.error("Error al enviar la solicitud");
    }
  };

  if (loading) {
    return <Loader text="Cargando vacaciones..." />;
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
          Historial
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
                <th className="border p-2">Fecha Inicio</th>
                <th className="border p-2">Fecha Fin</th>
                <th className="border p-2">Días Solicitados</th>
                <th className="border p-2">Motivo</th>
                <th className="border p-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {solicitudes.map((solicitud) => (
                <tr key={solicitud.id} className="border">
                  <td className="p-2">{solicitud.fechaInicio}</td>
                  <td className="p-2">{solicitud.fechaFin}</td>
                  <td className="p-2">{solicitud.diasSolicitados}</td>
                  <td className="p-2">{solicitud.motivo}</td>
                  <td className="p-2">{solicitud.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "historial" && <p>Historial de solicitudes (aún no implementado)</p>}

      {/* Modal para solicitar vacaciones */}
      <Modal isOpen={modalAbierto} onRequestClose={() => setModalAbierto(false)} className="modal">
        <div className="p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">Nueva Solicitud de Vacaciones</h2>
          <form onSubmit={manejarSolicitudVacaciones}>
            <div className="mb-4">
              <label className="block font-medium">Fecha Inicio</label>
              <input
                type="date"
                className="w-full p-2 border rounded"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label className="block font-medium">Fecha Fin</label>
              <input
                type="date"
                className="w-full p-2 border rounded"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label className="block font-medium">Días Solicitados</label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                value={diasSolicitados}
                onChange={(e) => setDiasSolicitados(Number(e.target.value))}
                min="1"
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

export default Vacaciones;
