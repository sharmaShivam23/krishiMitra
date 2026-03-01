import { Brain, Bot, Scan, CloudSun, IndianRupee, MessageSquare, Landmark, LineChart } from 'lucide-react';
import intelligence from "../../../public/ToolsImages/intelligence.avif"
import predict from "../../../public/ToolsImages/predict.avif"
import disease from "../../../public/ToolsImages/disease.avif"
import weather from "../../../public/ToolsImages/weather.avif"
import mandirates from "../../../public/ToolsImages/mandirates.avif"
import community from "../../../public/ToolsImages/community.avif"
import scheme from "../../../public/ToolsImages/scheme.avif"
import yieldImg from "../../../public/ToolsImages/yield.avif"

export const features = [
    { 
      icon: <Brain className="w-6 h-6" />, 
      title: 'AI Crop Intelligence', 
      desc: 'Machine learning models analyze soil health and weather patterns to predict optimal sowing and harvest times.', 
      img: intelligence,
      span: 'md:col-span-2 lg:col-span-2'
    },
    { 
      icon: <Bot className="w-6 h-6" />, 
      title: 'Sell Predictor AI', 
      desc: 'Forecast the exact optimum window to sell your harvest for maximum profit.', 
      img: predict,
      span: 'col-span-1'
    },
    { 
      icon: <Scan className="w-6 h-6" />, 
      title: 'Disease Vision AI', 
      desc: 'Snap a photo of a crop. Our AI instantly identifies pathogens and gives treatments.', 
      img: disease,
      span: 'col-span-1'
    },
    { 
      icon: <CloudSun className="w-6 h-6" />, 
      title: '7-Day Micro-Climate', 
      desc: 'Hyper-local 7-day weather forecasting and telemetry integrated directly with your specific crop timeline.', 
      img: weather,
      span: 'col-span-1'
    },
    { 
      icon: <IndianRupee className="w-6 h-6" />, 
      title: 'Real-Time Mandi Rates', 
      desc: 'Live APMC Mandi telemetry across India. Track daily price fluctuations for your specific commodities.', 
      img: mandirates,
      span: 'md:col-span-2 lg:col-span-2'
    },
    { 
      icon: <MessageSquare className="w-6 h-6" />, 
      title: 'Farmer Community', 
      desc: 'Connect with a vetted network of peer farmers. Share posts and resolve doubts.', 
      img: community,
      span: 'col-span-1'
    },
    { 
      icon: <Landmark className="w-6 h-6" />, 
      title: 'Govt. Schemes Locator', 
      desc: 'Automated matching with agricultural subsidies tailored to your land size.', 
      img: scheme,
      span: 'md:col-span-2 lg:col-span-2'
    },
    { 
      icon: <LineChart className="w-6 h-6" />, 
      title: 'Yield Analytics', 
      desc: 'Track historical harvest data and optimize future resource allocation.', 
      img: yieldImg,
      span: 'md:col-span-2 lg:col-span-2'
    },
  ];
