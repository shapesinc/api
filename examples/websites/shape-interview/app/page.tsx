import Link from "next/link"
import { Mic, MessageSquare, Star, Clock, Users, Briefcase, ArrowRight } from "lucide-react"

export default function Home() {
  const interviewTypes = [
    {
      id: 1,
      title: "Technical Interview",
      description: "Practice coding questions and system design problems commonly asked in tech interviews.",
      difficulty: "hard",
      icon: <Mic size={24} />,
      type: "voice",
    },
    {
      id: 2,
      title: "Behavioral Interview",
      description: "Prepare for questions about your past experiences and how you handled various situations.",
      difficulty: "normal",
      icon: <MessageSquare size={24} />,
      type: "text",
    },
    {
      id: 3,
      title: "Leadership Assessment",
      description: "Evaluate your leadership skills and decision-making abilities in various scenarios.",
      difficulty: "hard",
      icon: <Users size={24} />,
      type: "text",
    },
    {
      id: 4,
      title: "Quick Interview",
      description: "A short 5-minute interview to practice your elevator pitch and quick thinking.",
      difficulty: "easy",
      icon: <Clock size={24} />,
      type: "voice",
    },
    {
      id: 5,
      title: "Performance Review",
      description: "Simulate a performance review discussion to practice highlighting your achievements.",
      difficulty: "normal",
      icon: <Star size={24} />,
      type: "text",
    },
    {
      id: 6,
      title: "Job-Specific Interview",
      description: "Tailored questions for specific roles like product management, design, or marketing.",
      difficulty: "hard",
      icon: <Briefcase size={24} />,
      type: "voice",
    },
  ]

  return (
    <div>
      <section className="hero-section">
        <h1>Practice Interviews with AI</h1>
        <p>
          Prepare for your next interview with our AI-powered interview simulator. Choose from different interview types
          and difficulty levels, and practice using text or voice interactions.
        </p>
        <Link href="/create" className="hero-cta">
          Create Custom Interview
          <ArrowRight size={20} />
        </Link>
      </section>

      <section>
        <h2 className="section-title">Interview Types</h2>
        <div className="interview-grid">
          {interviewTypes.map((interview) => (
            <div key={interview.id} className="interview-card">
              <div className="interview-card-header">
                <h3>{interview.title}</h3>
                <div className="interview-icon">{interview.icon}</div>
              </div>
              <div className="interview-card-body">
                <p>{interview.description}</p>
              </div>
              <div className="interview-card-footer">
                <span className={`difficulty-badge difficulty-${interview.difficulty}`}>
                  {interview.difficulty.charAt(0).toUpperCase() + interview.difficulty.slice(1)}
                </span>
                <Link href={`/interview/${interview.id}`} className="button">
                  Start {interview.type === "voice" ? "Voice" : "Text"} Interview
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
