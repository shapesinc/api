export default function About() {
  return (
    <div className="about-content">
      <h1>About Shape Interviewer</h1>

      <section>
        <h2>What is Shape Interviewer?</h2>
        <p>
          Shape Interviewer is an AI-powered platform that helps you practice and prepare for various types of
          interviews. Using the Shapes API, our application simulates realistic interview scenarios, providing you with
          valuable feedback and helping you improve your interview skills.
        </p>
      </section>

      <section>
        <h2>Features</h2>
        <ul>
          <li>Multiple interview types (technical, behavioral, leadership, etc.)</li>
          <li>Different difficulty levels to match your experience</li>
          <li>Text and voice interaction options</li>
          <li>Markdown support for rich text formatting</li>
          <li>Custom interview creation</li>
          <li>Realistic AI-powered responses</li>
          <li>Dark and light mode support</li>
          <li>Responsive design for all devices</li>
        </ul>
      </section>

      <section>
        <h2>How It Works</h2>
        <p>
          Shape Interviewer uses the Shapes API to create intelligent, conversational AI interviewers. Each Shape is
          designed with a specific personality and interview style to provide a realistic interview experience. The
          application supports both text-based interviews and voice interviews, allowing you to practice in the format
          that best suits your needs.
        </p>
        <p>
          For voice interviews, your audio is securely stored using Vercel Blob and processed to convert speech to text.
          This allows the AI to understand and respond to your spoken answers just as it would in a real interview.
        </p>
      </section>

      <section>
        <h2>Privacy</h2>
        <p>
          We take your privacy seriously. Voice recordings are only stored temporarily for processing and are not used
          for any other purpose. All interview data is kept confidential and is not shared with third parties.
        </p>
      </section>

      <section>
        <h2>Accessibility</h2>
        <p>
          Our application is designed with accessibility in mind, featuring proper contrast ratios, keyboard navigation
          support, screen reader compatibility, and reduced motion options for users with vestibular disorders.
        </p>
      </section>
    </div>
  )
}
