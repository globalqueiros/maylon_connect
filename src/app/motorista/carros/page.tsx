"use client";
import Image from "next/image";
import { MapPin, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useRef } from "react";

export default function CarCard() {
  const car = {
    nome: "VOLKSWAGEN GOL",
    modelo: "1.0 12V MPI TOTALFLEX TRENDLINE 4P MANUAL",
    preco: "R$ 36.500",
    ano: "2017/2018",
    km: "350.000 km",
    cidade: "Valinhos - SP",
    imagens: ["/gol.jpg", "/banner.png"],
  };

  const [index, setIndex] = useState(0);

  // 👉 swipe
  const startX = useRef(0);

  const handleTouchStart = (e: any) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: any) => {
    const endX = e.changedTouches[0].clientX;
    const diff = startX.current - endX;

    if (diff > 50) next();      // arrastou pra esquerda
    if (diff < -50) prev();     // arrastou pra direita
  };

  const next = () => {
    setIndex((prev) =>
      prev === car.imagens.length - 1 ? 0 : prev + 1
    );
  };

  const prev = () => {
    setIndex((prev) =>
      prev === 0 ? car.imagens.length - 1 : prev - 1
    );
  };

  return (
    <div className="p-4">
      <div className="w-full max-w-xs bg-white rounded-xl overflow-hidden shadow-md group">
        
        {/* SLIDER */}
        <div
          className="relative h-40 overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* IMAGENS */}
          <div
            className="flex transition-transform duration-300"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {car.imagens.map((img, i) => (
              <div key={i} className="min-w-full h-40 relative">
                <Image
                  src={img}
                  alt="Carro"
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>

          {/* BOTÃO ESQUERDA */}
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/70 p-1 rounded-full"
          >
            <ChevronLeft size={18} />
          </button>

          {/* BOTÃO DIREITA */}
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/70 p-1 rounded-full"
          >
            <ChevronRight size={18} />
          </button>

          {/* FAVORITO */}
          <button className="absolute top-2 right-2 bg-white/80 p-1.5 rounded-full">
            <Heart size={16} />
          </button>

          {/* BOLINHAS */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {car.imagens.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${
                  i === index ? "bg-[#00bba7]" : "bg-white/70"
                }`}
              />
            ))}
          </div>
        </div>

        {/* CONTEÚDO */}
        <div className="p-3">
          <h2 className="text-xs font-bold text-gray-800">
            {car.nome}
          </h2>

          <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">
            {car.modelo}
          </p>

          <p className="text-lg font-bold text-gray-900 mt-2">
            {car.preco}
          </p>

          <div className="flex justify-between text-[11px] text-gray-500 mt-1">
            <span>{car.ano}</span>
            <span>{car.km}</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-2">
            <MapPin size={12} />
            <span>{car.cidade}</span>
          </div>
        </div>
      </div>
    </div>
  );
}