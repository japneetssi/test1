import { useState, useEffect } from "react";

interface LinkedSliderProps {
    label: string;
    min: number;
    max: number;
    step: number;
    value: number;
    onChange: (value: number) => void;
    prefix?: string;
    suffix?: string;
}

export const LinkedSlider = ({
    label,
    min,
    max,
    step,
    value,
    onChange,
    prefix = "",
    suffix = "",
}: LinkedSliderProps) => {
    const [inputValue, setInputValue] = useState<string>(value.toString());

    // Sync internal input state when external value changes (e.g., initial load or reset)
    useEffect(() => {
        setInputValue(value.toString());
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInputValue(val);

        // Only fire onChange if it's a valid number within reasonable bounds (we'll strictly clamp on blur)
        const num = parseFloat(val);
        if (!isNaN(num)) {
            // Let the user type freely before clamping on blur, but update parent if it's somewhat valid
            if (num >= min && num <= max) {
                onChange(num);
            }
        }
    };

    const handleInputBlur = () => {
        let num = parseFloat(inputValue);
        if (isNaN(num)) {
            num = min;
        } else {
            num = Math.max(min, Math.min(max, num)); // Clamp
        }
        setInputValue(num.toString());
        onChange(num);
    };

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const num = parseFloat(e.target.value);
        setInputValue(num.toString());
        onChange(num);
    };

    // Calculate percentage for slider fill
    const percentage = ((value - min) / (max - min)) * 100;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">{label}</label>
                <div className="relative flex items-center">
                    {prefix && <span className="absolute left-3 text-sm text-slate-500 font-medium">{prefix}</span>}
                    <input
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        className={`w-28 text-right font-bold text-[#00458c] bg-white border border-slate-300 rounded-md py-1.5 focus:outline-none focus:ring-2 focus:ring-[#f37920]/50 focus:border-[#f37920] transition-shadow ${prefix ? 'pl-8 pr-3' : 'px-3'} ${suffix ? 'pr-8' : ''}`}
                    />
                    {suffix && <span className="absolute right-3 text-sm text-slate-500 font-medium">{suffix}</span>}
                </div>
            </div>

            <div className="relative py-2">
                <div
                    className="absolute h-1.5 bg-[#f37920] rounded-l-full top-1/2 -translate-y-1/2 pointer-events-none z-10"
                    style={{ width: `${percentage}%` }}
                />
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={handleSliderChange}
                    className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer relative z-20 hover:bg-slate-300 transition-colors [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#f37920] [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-grab active:[&::-webkit-slider-thumb]:cursor-grabbing [&::-webkit-slider-thumb]:transition-transform hover:[&::-webkit-slider-thumb]:scale-110 bg-transparent"
                />
            </div>

            <div className="flex justify-between text-xs text-slate-400 font-medium">
                <span>{prefix}{Intl.NumberFormat('en-IN').format(min)}{suffix}</span>
                <span>{prefix}{Intl.NumberFormat('en-IN').format(max)}{suffix}</span>
            </div>
        </div>
    );
};
