import React from "react";
import { AlertTriangle } from "lucide-react";

interface PermissionDeniedAlertProps {
  message: string;
  details?: {
    requiredPermissions: string[];
    userPermissions: string[];
  };
}

const PermissionDeniedAlert: React.FC<PermissionDeniedAlertProps> = ({ message, details }) => {
  return (
    <div className="max-w-md mx-auto mt-10 bg-white border-l-8 border-red-500 shadow-lg rounded-lg p-6 flex flex-col items-center animate-fade-in">
      <AlertTriangle className="text-red-500 w-16 h-16 mb-2" />
      <h2 className="text-xl font-bold text-red-600 mb-2">Acceso denegado</h2>
      <p className="text-gray-700 text-center mb-2">{message}</p>
      {details && (
        <details className="mt-2 w-full">
          <summary className="cursor-pointer text-sm text-gray-500">Ver detalles técnicos</summary>
          <div className="text-xs text-gray-600 mt-2">
            <strong>Permisos requeridos:</strong> {details.requiredPermissions.join(", ")}<br />
            <strong>Tus permisos:</strong> {details.userPermissions.join(", ")}
          </div>
        </details>
      )}
    </div>
  );
};

export default PermissionDeniedAlert; 