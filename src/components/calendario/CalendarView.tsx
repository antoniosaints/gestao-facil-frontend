import React, { useState } from "react";
import { ArrowBigRight, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/contexts/AppContext";
import { useProfile } from "@/contexts/ProfileContext";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addDays,
  addWeeks,
  subWeeks,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { QuickReserveModal } from "./QuickReserveModal";

interface CalendarViewProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  view: "month" | "week" | "day";
  onViewChange: (view: "month" | "week" | "day") => void;
  filtroQuadra: string;
  onQuickReserve?: (date: Date, hour: number) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  selectedDate,
  onDateSelect,
  view,
  onViewChange,
  filtroQuadra,
  onQuickReserve,
}) => {
  const { reservas, quadras } = useApp();
  const { profileSettings } = useProfile();
  const [currentMonth, setCurrentMonth] = useState(selectedDate);
  const [currentWeek, setCurrentWeek] = useState(selectedDate);
  const [quickReserveModal, setQuickReserveModal] = useState({
    open: false,
    date: new Date(),
    hour: 0,
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: addDays(weekStart, 6),
  });

  const getReservasForDay = (day: Date) => {
    const reservasFiltradas =
      filtroQuadra === "todas"
        ? reservas
        : reservas.filter((r) => r.quadraId === filtroQuadra);

    return reservasFiltradas.filter(
      (reserva) =>
        isSameDay(reserva.dataInicio, day) && reserva.status !== "cancelado"
    );
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth(
      direction === "prev"
        ? subMonths(currentMonth, 1)
        : addMonths(currentMonth, 1)
    );
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const newWeek =
      direction === "prev"
        ? subWeeks(currentWeek, 1)
        : addWeeks(currentWeek, 1);
    setCurrentWeek(newWeek);
    onDateSelect(newWeek);
  };

  const navigateDay = (direction: "prev" | "next") => {
    const newDay =
      direction === "prev"
        ? addDays(selectedDate, -1)
        : addDays(selectedDate, 1);
    onDateSelect(newDay);
  };

  const handleQuickReserve = (hour: number) => {
    setQuickReserveModal({
      open: true,
      date: selectedDate,
      hour,
    });
  };

  const getBusinessHours = () => {
    const [inicioHora] = profileSettings.horarioFuncionamento.inicio
      .split(":")
      .map(Number);
    const [fimHora] = profileSettings.horarioFuncionamento.fim
      .split(":")
      .map(Number);
    return { inicioHora, fimHora };
  };

  const isWithinBusinessHours = (hour: number) => {
    const { inicioHora, fimHora } = getBusinessHours();
    return hour >= inicioHora && hour < fimHora;
  };

  const renderMonthView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth("prev")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-semibold capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth("next")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Select
          value={view}
          onValueChange={(value: "month" | "week" | "day") =>
            onViewChange(value)
          }
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Mês</SelectItem>
            <SelectItem value="week">Semana</SelectItem>
            <SelectItem value="day">Dia</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
        {days.map((day) => {
          const dayReservas = getReservasForDay(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());

          return (
            <button
              key={day.toString()}
              onClick={() => onDateSelect(day)}
              className={`
                p-2 h-24 border border-gray-200 hover:bg-gray-50 flex flex-col items-start dark:border-gray-800 dark:hover:bg-gray-800
                ${
                  !isCurrentMonth
                    ? "text-gray-400 bg-gray-50 dark:bg-gray-800 dark:text-gray-600"
                    : ""
                }
                ${
                  isSelected
                    ? "bg-primary text-primary-foreground dark:text-white"
                    : ""
                }
                ${
                  isToday && !isSelected
                    ? "bg-blue-50 text-blue-700 border-blue-200 dark:border-blue-800 dark:text-blue-100 dark:bg-blue-800"
                    : ""
                }
              `}
            >
              <span className="text-sm font-medium mb-1">
                {format(day, "d")}
              </span>
              <div className="space-y-1 w-full">
                {dayReservas.slice(0, 2).map((reserva) => (
                  <div
                    key={reserva.id}
                    className={`text-xs px-1 py-0.5 rounded truncate ${
                      reserva.status === "confirmado"
                        ? "bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-100"
                        : reserva.status === "pendente"
                        ? "bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100"
                        : "bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
                    }`}
                  >
                    {format(reserva.dataInicio, "HH:mm")} -{" "}
                    {reserva.cliente.nome}
                  </div>
                ))}
                {dayReservas.length > 2 && (
                  <div className="text-xs text-gray-500">
                    +{dayReservas.length - 2} mais
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderWeekView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateWeek("prev")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-semibold">
            {format(weekStart, "d MMM", { locale: ptBR })} -{" "}
            {format(addDays(weekStart, 6), "d MMM yyyy", { locale: ptBR })}
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateWeek("next")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Select
          value={view}
          onValueChange={(value: "month" | "week" | "day") =>
            onViewChange(value)
          }
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Mês</SelectItem>
            <SelectItem value="week">Semana</SelectItem>
            <SelectItem value="day">Dia</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const dayReservas = getReservasForDay(day);
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());

          return (
            <div key={day.toString()} className="space-y-2">
              <button
                onClick={() => onDateSelect(day)}
                className={`
                  w-full p-3 rounded-lg border text-center hover:bg-gray-50 dark:hover:bg-blue-800
                  ${
                    isSelected
                      ? "bg-primary text-primary-foreground dark:text-white"
                      : ""
                  }
                  ${
                    isToday && !isSelected
                      ? "bg-blue-50 text-blue-700 border-blue-200 dark:border-blue-800 dark:text-blue-100 dark:bg-blue-800"
                      : ""
                  }
                `}
              >
                <div className="text-sm font-medium">
                  {format(day, "EEE", { locale: ptBR })}
                </div>
                <div className="text-lg font-bold">{format(day, "d")}</div>
              </button>
              <div className="space-y-1">
                {dayReservas.map((reserva) => (
                  <div
                    key={reserva.id}
                    className={`text-xs p-2 rounded ${
                      reserva.status === "confirmado"
                        ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                        : reserva.status === "pendente"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
                    }`}
                  >
                    <div className="font-medium">
                      {format(reserva.dataInicio, "HH:mm")} -{" "}
                      {format(reserva.dataFim, "HH:mm")}
                    </div>
                    <div className="truncate">{reserva.quadra.nome}</div>
                    <div className="truncate">{reserva.cliente.nome}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderDayView = () => {
    const dayReservas = getReservasForDay(selectedDate).sort(
      (a, b) => a.dataInicio.getTime() - b.dataInicio.getTime()
    );

    const { inicioHora, fimHora } = getBusinessHours();
    const totalHours = fimHora - inicioHora;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDay("prev")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-semibold capitalize">
              {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", {
                locale: ptBR,
              })}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDay("next")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Select
            value={view}
            onValueChange={(value: "month" | "week" | "day") =>
              onViewChange(value)
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Mês</SelectItem>
              <SelectItem value="week">Semana</SelectItem>
              <SelectItem value="day">Dia</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          {Array.from({ length: totalHours }, (_, i) => {
            const hour = i + inicioHora;
            const timeSlot = new Date(selectedDate);
            timeSlot.setHours(hour, 0, 0, 0);

            const slotReservas = dayReservas.filter(
              (reserva) =>
                reserva.dataInicio.getHours() <= hour &&
                reserva.dataFim.getHours() > hour
            );

            function isSameHour(): boolean {
              const now = new Date();
              return (
                isSameDay(timeSlot, new Date()) &&
                now.getHours() === timeSlot.getHours()
              );
            }

            return (
              <div
                key={hour}
                className={`flex items-center space-x-4 p-3 border relative rounded-lg ${
                  isSameHour()
                    ? "border-2 border-primary bg-yellow-100/30 dark:bg-yellow-950/60"
                    : ""
                }`}
              >
                <span
                  className={`
                  ${
                    isSameHour() ? "flex" : "hidden"
                  } absolute left-[-.65rem] w-5 bg-gray-50 dark:bg-gray-900 border-2 border-primary rounded-full`}
                >
                  <ArrowBigRight />
                </span>
                <div className="w-16 text-sm font-medium text-muted-foreground">
                  {String(hour).padStart(2, "0")}:00
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                  {slotReservas.length > 0 ? (
                    slotReservas.map((reserva) => (
                      <div
                        key={reserva.id}
                        className={`px-3 py-2 rounded-lg ${
                          reserva.status === "confirmado"
                            ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                            : reserva.status === "pendente"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
                        }`}
                      >
                        <div className="font-medium truncate">
                          {reserva.cliente.nome}
                        </div>
                        <div className="text-sm">{reserva.quadra.nome}</div>
                        <div className="text-xs">
                          {format(reserva.dataInicio, "HH:mm")} -{" "}
                          {format(reserva.dataFim, "HH:mm")}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {timeSlot >= new Date() ? (
                        <span className="text-violet-900 px-2 py-1 bg-violet-50 dark:bg-violet-900 dark:text-violet-50 rounded-md">
                          Disponível
                        </span>
                      ) : (
                        <span
                          className={`text-red-900 px-2 py-1 bg-red-50 dark:bg-red-900 dark:text-red-50 rounded-md 
                        ${
                          isSameHour() ? "dark:bg-yellow-900 bg-yellow-100" : ""
                        }`}
                        >
                          {isSameHour() ? "Em andamento" : "Indisponível"}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickReserve(hour)}
                  className="flex-shrink-0"
                  title="Reserva rápida"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>

        <QuickReserveModal
          open={quickReserveModal.open}
          onOpenChange={(open) =>
            setQuickReserveModal((prev) => ({ ...prev, open }))
          }
          selectedDate={quickReserveModal.date}
          selectedHour={quickReserveModal.hour}
          filtroQuadra={filtroQuadra}
        />
      </div>
    );
  };

  return (
    <Card className="flex-1 border-2 border-gray-300 dark:border-gray-600">
      <CardContent className="p-6">
        {view === "month" && renderMonthView()}
        {view === "week" && renderWeekView()}
        {view === "day" && renderDayView()}
      </CardContent>
    </Card>
  );
};
