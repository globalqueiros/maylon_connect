"use client";
import Image from "next/image";
import { MapPin, Heart } from "lucide-react";

export default function CarCard() {
    const car = {
        nome: "VOLKSWAGEN GOL",
        modelo: "1.0 12V MPI TOTALFLEX TRENDLINE 4P MANUAL",
        preco: "R$ 36.500",
        ano: "2017/2018",
        km: "350.000 km",
        cidade: "Valinhos - SP",
        imagem: "/gol.jpg",
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Venda de Carro</h1>
            <div className="w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition group">
                <div className="relative h-52">
                    <Image
                        src={car.imagem}
                        alt="Carro"
                        fill
                        className="object-cover group-hover:scale-105 transition"
                    />
                    <button className="absolute cursor-pointer top-3 right-3 bg-white/80 p-2 rounded-full backdrop-blur hover:bg-white">
                        <Heart size={18} />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                        {[...Array(8)].map((_, i) => (
                            <div
                                key={i}
                                className={`w-2 h-2 cursor-pointer rounded-full ${i === 2 ? "bg-[#00bba7]" : "bg-white/70"
                                    }`}
                            />
                        ))}
                    </div>
                </div>
                <div className="p-4">
                    <h2 className="text-sm font-bold text-gray-800">
                        {car.nome}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {car.modelo}
                    </p>
                    <p className="text-xl font-bold text-gray-900 mt-3">
                        {car.preco}
                    </p>
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>{car.ano}</span>
                        <span>{car.km}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-3">
                        <MapPin size={14} />
                        <span>{car.cidade}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}