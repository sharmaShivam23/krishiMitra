import { Brain, Bot, Scan, CloudSun, IndianRupee, MessageSquare, Landmark, LineChart } from 'lucide-react';
import intelligence from "../../../public/ToolsImages/intelligence.webp"
import predict from "../../../public/ToolsImages/predict.webp"
import disease from "../../../public/ToolsImages/disease.webp"
import weather from "../../../public/ToolsImages/weather.webp"
import mandirates from "../../../public/ToolsImages/mandirates.webp"
import community from "../../../public/ToolsImages/community.webp"
import scheme from "../../../public/ToolsImages/scheme.webp"
import yieldImg from "../../../public/ToolsImages/yield.webp"

export const features = [
  {
    id: 'cropIntel', 
    icon: <Brain className="w-6 h-6" />, 
    img: intelligence,
    span: 'md:col-span-2 lg:col-span-2'
  },
  { 
    id: 'sellPredictor', 
    icon: <Bot className="w-6 h-6" />, 
    img: predict,
    span: 'col-span-1'
  },
  { 
    id: 'diseaseVision',
    icon: <Scan className="w-6 h-6" />, 
    img: disease,
    span: 'col-span-1'
  },
  { 
    id: 'microClimate',
    icon: <CloudSun className="w-6 h-6" />, 
    img: weather,
    span: 'col-span-1'
  },
  { 
    id: 'mandiRates',
    icon: <IndianRupee className="w-6 h-6" />, 
    img: mandirates,
    span: 'md:col-span-2 lg:col-span-2'
  },
  { 
    id: 'community',
    icon: <MessageSquare className="w-6 h-6" />, 
    img: community,
    span: 'col-span-1'
  },
  { 
    id: 'schemes',
    icon: <Landmark className="w-6 h-6" />, 
    img: scheme,
    span: 'md:col-span-2 lg:col-span-2'
  },
  { 
    id: 'yieldAnalytics',
    icon: <LineChart className="w-6 h-6" />, 
    img: yieldImg,
    span: 'md:col-span-2 lg:col-span-2'
  },
];