import { useState } from 'react';

// Style presets that can be easily customized
const styles = {
  container: {
    wrapper: "mb-8",
    base: "bg-white rounded-lg shadow-md",
  },
  header: {
    wrapper: "px-6 pt-6",
    base: "w-full flex items-center justify-between text-left mb-6",
    title: {
      base: "text-2xl font-bold text-gray-800",
    },
    icon: {
      base: "w-6 h-6 transform transition-transform",
      open: "rotate-180",
      closed: "",
    }
  },
  stepsGrid: {
    wrapper: "px-6 pb-6",
    base: "grid gap-6",
    layout: {
      mobile: "grid-cols-1",
      tablet: "md:grid-cols-2",
      desktop: "lg:grid-cols-4",
    }
  },
  step: {
    container: {
      base: "flex-1 p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200",
    },
    iconWrapper: {
      base: "flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600",
    },
    content: {
      base: "flex items-center gap-4 mb-3",
      stepNumber: {
        base: "text-sm font-medium text-blue-600",
      },
      title: {
        base: "text-lg font-semibold text-gray-900",
      },
      description: {
        base: "text-sm text-gray-600",
      }
    }
  },
  animation: {
    enter: "transition-all duration-200 ease-out",
    leave: "transition-all duration-150 ease-in"
  }
};

const Step = ({ 
  number, 
  title, 
  description, 
  icon,
  animate = true 
}) => (
  <div className={`
    ${styles.step.container.base}
    ${animate ? styles.animation.enter : ''}
  `}>
    <div className={styles.step.content.base}>
      <div className={styles.step.iconWrapper.base}>
        {icon}
      </div>
      <div>
        <div className={styles.step.content.stepNumber.base}>
          Step {number}
        </div>
        <h3 className={styles.step.content.title.base}>
          {title}
        </h3>
      </div>
    </div>
    <p className={styles.step.content.description.base}>
      {description}
    </p>
  </div>
);

const HowItWorks = ({ 
  initiallyOpen = true,
  animate = true,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(initiallyOpen);

  const steps = [
    {
      number: 1,
      title: "Find a Starting Image",
      description: "Search, generate, or upload your own image from your computer or URL.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      number: 2,
      title: "Adjust Your Image",
      description: "Crop your image and remove the background for the best pixel art results.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
        </svg>
      )
    },
    {
      number: 3,
      title: "Create Pixel Art",
      description: "Optimize colors and manually edit pixels on the canvas to perfect your artwork.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      )
    },
    {
      number: 4,
      title: "Download & Share",
      description: "Download your pixel art or share it with the Yoto icons community.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      )
    }
  ];

  return (
    <div className={`${styles.container.wrapper} ${className}`}>
      <div className={styles.container.base}>
        <div className={styles.header.wrapper}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={styles.header.base}
          >
            <h2 className={styles.header.title.base}>How It Works</h2>
            <svg
              className={`
                ${styles.header.icon.base}
                ${isOpen ? styles.header.icon.open : styles.header.icon.closed}
              `}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 9l-7 7-7-7" 
              />
            </svg>
          </button>
        </div>

        {isOpen && (
          <div className={styles.stepsGrid.wrapper}>
            <div className={`
              ${styles.stepsGrid.base}
              ${styles.stepsGrid.layout.mobile}
              ${styles.stepsGrid.layout.tablet}
              ${styles.stepsGrid.layout.desktop}
              ${animate ? styles.animation.enter : ''}
            `}>
              {steps.map((step) => (
                <Step 
                  key={step.number} 
                  {...step}
                  animate={animate}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HowItWorks; 