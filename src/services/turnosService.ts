// Simulación de servicio para gestionar cambios de turno
export const obtenerTurnos = async () => {
    return [
        { id: 1, empleado: "Juan Pérez", turnoActual: "Mañana", nuevoTurno: "Tarde", estado: "Pendiente" },
        { id: 2, empleado: "Ana Gómez", turnoActual: "Tarde", nuevoTurno: "Noche", estado: "Aprobado" },
    ];
};

export const solicitarCambioTurno = async (datos) => {
    console.log("Solicitud enviada:", datos);
    return { success: true, message: "Solicitud enviada correctamente" };
};
