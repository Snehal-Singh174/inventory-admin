import React from 'react';
import AppImage from './AppImage';
import { cn } from '../utils/cn';

function Logo({
    src,
    alt = "Logo",
    size = "md",
    className = "",
    ...props
}) {
    // Define size variants
    const sizeClasses = {
        xs: "h-6 w-auto",
        sm: "h-8 w-auto",
        md: "h-12 w-auto",
        lg: "h-16 w-auto",
        xl: "h-20 w-auto",
        "2xl": "h-24 w-auto"
    };

    return (
        <AppImage
            src={src}
            alt={alt}
            className={cn(
                "object-contain",
                sizeClasses[size] || sizeClasses.md,
                className
            )}
            {...props}
        />
    );
}

export default Logo;
