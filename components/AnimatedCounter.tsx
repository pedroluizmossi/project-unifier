import { useEffect, useRef, useState } from 'react';
import { useMotionValue, useTransform, animate, motion } from 'motion/react';

interface AnimatedCounterProps {
    value: number;
    prefix?: string;
    suffix?: string;
    duration?: number;
    formatFn?: (n: number) => string;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
    value,
    prefix = '',
    suffix = '',
    duration = 1,
    formatFn,
}) => {
    const motionValue = useMotionValue(0);
    const [display, setDisplay] = useState('0');
    const prevValue = useRef(0);

    useEffect(() => {
        const from = prevValue.current;
        prevValue.current = value;

        const controls = animate(motionValue, value, {
            duration,
            ease: 'easeOut',
            onUpdate: (latest) => {
                const rounded = Math.round(latest);
                setDisplay(formatFn ? formatFn(rounded) : rounded.toLocaleString());
            },
        });

        return () => controls.stop();
    }, [value, duration, formatFn, motionValue]);

    return (
        <motion.span
            key={value}
            initial={{ opacity: 0.6, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
        >
            {prefix}{display}{suffix}
        </motion.span>
    );
};

export default AnimatedCounter;
