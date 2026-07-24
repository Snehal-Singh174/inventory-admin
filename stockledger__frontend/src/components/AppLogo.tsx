import React from 'react';
import AppImage from './AppImage';
import { cn } from '../utils/cn';

interface LogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src?: string;
    alt?: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    variant?: 'default' | 'rounded' | 'circle';
}

const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24'
};

const variantClasses = {
    default: '',
    rounded: 'rounded-lg',
    circle: 'rounded-full'
};

function Logo({
    src = '/assets/images/no_image.png',
    alt = 'Logo',
    className = '',
    size = 'md',
    variant = 'default',
    ...props
}: LogoProps) {
    return (
        <AppImage
            src={src}
            alt={alt}
            className={cn(
                'object-contain',
                sizeClasses[size],
                variantClasses[variant],
                className
            )}
            {...props}
        />
    );
}

export default Logo;