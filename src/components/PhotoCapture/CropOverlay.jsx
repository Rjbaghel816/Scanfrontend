import React, { useState, useEffect, useRef, useCallback } from 'react';

const CropOverlay = ({ videoRef, stream, cropMargins, onUpdateMargins, onSave }) => {
    const [dimensions, setDimensions] = useState({ width: 0, height: 0, left: 0, top: 0 });
    const overlayRef = useRef(null);
    const isDragging = useRef(null); // 'n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw', or 'move'
    const startPos = useRef({ x: 0, y: 0 });
    const startMargins = useRef(null);

    // Update dimensions when video resizes or stream changes
    useEffect(() => {
        const updateDimensions = () => {
            if (videoRef.current) {
                const rect = videoRef.current.getBoundingClientRect();
                setDimensions({
                    width: rect.width,
                    height: rect.height,
                    left: rect.left,
                    top: rect.top
                });
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        const interval = setInterval(updateDimensions, 1000); // Check periodically for layout changes

        return () => {
            window.removeEventListener('resize', updateDimensions);
            clearInterval(interval);
        };
    }, [videoRef, stream]);

    // Calculate the visual box based on margins and video dimensions
    const getBoxStyle = () => {
        if (!dimensions.width || !dimensions.height) return { display: 'none' };

        // Margins are in "source" pixels (e.g. 1920x1080). We need to scale them to "displayed" pixels.
        const videoWidth = videoRef.current?.videoWidth || 1280;
        const videoHeight = videoRef.current?.videoHeight || 720;

        const scaleX = dimensions.width / videoWidth;
        const scaleY = dimensions.height / videoHeight;

        const top = cropMargins.top * scaleY;
        const bottom = cropMargins.bottom * scaleY;
        const left = cropMargins.left * scaleX;
        const right = cropMargins.right * scaleX;

        return {
            position: 'absolute',
            top: `${top}px`,
            left: `${left}px`,
            right: `${right}px`,
            bottom: `${bottom}px`,
            border: '2px solid #00ff00',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)', // Dim outside area
            pointerEvents: 'auto',
            cursor: 'move'
        };
    };

    const handleMouseDown = (e, type) => {
        e.preventDefault();
        e.stopPropagation();
        isDragging.current = type;
        startPos.current = { x: e.clientX, y: e.clientY };
        startMargins.current = { ...cropMargins };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = useCallback((e) => {
        if (!isDragging.current || !startMargins.current || !videoRef.current) return;

        const videoWidth = videoRef.current.videoWidth || 1280;
        const videoHeight = videoRef.current.videoHeight || 720;
        const scaleX = videoWidth / dimensions.width;
        const scaleY = videoHeight / dimensions.height;

        const dx = (e.clientX - startPos.current.x) * scaleX;
        const dy = (e.clientY - startPos.current.y) * scaleY;

        let newMargins = { ...startMargins.current };

        if (isDragging.current === 'move') {
            // Move the whole box
            // Check bounds to prevent moving out of video
            const currentWidth = videoWidth - newMargins.left - newMargins.right;
            const currentHeight = videoHeight - newMargins.top - newMargins.bottom;

            // Tentative new positions
            let newLeft = newMargins.left + dx;
            let newTop = newMargins.top + dy;
            let newRight = newMargins.right - dx;
            let newBottom = newMargins.bottom - dy;

            // Constrain
            if (newLeft < 0) { newRight += newLeft; newLeft = 0; }
            if (newTop < 0) { newBottom += newTop; newTop = 0; }
            if (newRight < 0) { newLeft += newRight; newRight = 0; }
            if (newBottom < 0) { newTop += newBottom; newBottom = 0; }

            newMargins = { top: newTop, bottom: newBottom, left: newLeft, right: newRight };

        } else {
            // Resize specific edges
            if (isDragging.current.includes('n')) newMargins.top = Math.max(0, Math.min(videoHeight - newMargins.bottom - 50, startMargins.current.top + dy));
            if (isDragging.current.includes('s')) newMargins.bottom = Math.max(0, Math.min(videoHeight - newMargins.top - 50, startMargins.current.bottom - dy));
            if (isDragging.current.includes('w')) newMargins.left = Math.max(0, Math.min(videoWidth - newMargins.right - 50, startMargins.current.left + dx));
            if (isDragging.current.includes('e')) newMargins.right = Math.max(0, Math.min(videoWidth - newMargins.left - 50, startMargins.current.right - dx));
        }

        onUpdateMargins(newMargins);
    }, [dimensions, cropMargins, onUpdateMargins]);

    const handleMouseUp = () => {
        isDragging.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    // Handles
    const handleStyle = {
        position: 'absolute',
        width: '20px',
        height: '20px',
        backgroundColor: '#00ff00',
        borderRadius: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10
    };

    return (
        <div
            ref={overlayRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none', // Let clicks pass through to video/buttons unless hitting the crop box
                overflow: 'hidden'
            }}
        >
            <div
                style={getBoxStyle()}
                onMouseDown={(e) => handleMouseDown(e, 'move')}
            >
                {/* Corners */}
                <div style={{ ...handleStyle, top: '0%', left: '0%', cursor: 'nw-resize' }} onMouseDown={(e) => handleMouseDown(e, 'nw')} />
                <div style={{ ...handleStyle, top: '0%', left: '100%', cursor: 'ne-resize' }} onMouseDown={(e) => handleMouseDown(e, 'ne')} />
                <div style={{ ...handleStyle, top: '100%', left: '100%', cursor: 'se-resize' }} onMouseDown={(e) => handleMouseDown(e, 'se')} />
                <div style={{ ...handleStyle, top: '100%', left: '0%', cursor: 'sw-resize' }} onMouseDown={(e) => handleMouseDown(e, 'sw')} />

                {/* Edges (invisible hit areas) */}
                <div style={{ position: 'absolute', top: '-5px', left: '10px', right: '10px', height: '10px', cursor: 'n-resize' }} onMouseDown={(e) => handleMouseDown(e, 'n')} />
                <div style={{ position: 'absolute', bottom: '-5px', left: '10px', right: '10px', height: '10px', cursor: 's-resize' }} onMouseDown={(e) => handleMouseDown(e, 's')} />
                <div style={{ position: 'absolute', left: '-5px', top: '10px', bottom: '10px', width: '10px', cursor: 'w-resize' }} onMouseDown={(e) => handleMouseDown(e, 'w')} />
                <div style={{ position: 'absolute', right: '-5px', top: '10px', bottom: '10px', width: '10px', cursor: 'e-resize' }} onMouseDown={(e) => handleMouseDown(e, 'e')} />

                {/* Dimensions Label & Save Button */}
                <div style={{
                    position: 'absolute',
                    top: '-40px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: '10px',
                    pointerEvents: 'auto'
                }}>
                    <div style={{
                        background: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        whiteSpace: 'nowrap'
                    }}>
                        Adjust Crop
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onSave();
                        }}
                        style={{
                            background: '#00ff00',
                            color: 'black',
                            border: 'none',
                            padding: '4px 12px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        DONE
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CropOverlay;
