"use client";

interface ReadinessScoreProps {
  score: number;
}

export default function ReadinessScore({ score }: ReadinessScoreProps) {
  // Calculate circle properties
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 flex flex-col items-center justify-center dark:bg-zinc-900/60 dark:border-zinc-800">
      <h3 className="text-gray-900 font-semibold mb-4 text-lg dark:text-white">
        Readiness Score
      </h3>
      <div className="relative w-40 h-40">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            className="text-gray-100 dark:text-zinc-800"
            strokeWidth="12"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="80"
            cy="80"
          />
          <circle
            className="text-yellow-500 transition-all duration-1000 ease-out"
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="80"
            cy="80"
          />
        </svg>
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center flex-col">
          <span className="text-4xl font-bold text-gray-800 dark:text-gray-200">
            {score}%
          </span>
        </div>
      </div>
      <p className="text-sm text-gray-500 mt-4 text-center dark:text-gray-400">
        Complete tasks to increase your score
      </p>
    </div>
  );
}
