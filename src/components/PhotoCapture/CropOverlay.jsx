import React, { useState, useEffect, useRef, useCallback } from "react";

const CropOverlay = ({
  videoRef,
  stream,
  cropMargins,
  onUpdateMargins,
  onSave,
}) => {
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0,
    left: 0,
    top: 0,
  });
  const overlayRef = useRef(null);
  const isDragging = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });
  const startMargins = useRef(null);
  const displayScaleRef = useRef({
    scaleX: 1,
    scaleY: 1,
    offsetX: 0,
    offsetY: 0,
  });

  // Get actual displayed video dimensions (excluding letterboxing)
  const getDisplayedVideoRect = useCallback(() => {
    if (!videoRef.current || !dimensions.width || !dimensions.height) {
      return { width: 0, height: 0, offsetX: 0, offsetY: 0 };
    }

    const video = videoRef.current;
    const videoWidth = video.videoWidth || 1280;
    const videoHeight = video.videoHeight || 720;
    const containerWidth = dimensions.width;
    const containerHeight = dimensions.height;

    // Calculate actual displayed video area (handles letterboxing)
    const videoAspect = videoWidth / videoHeight;
    const containerAspect = containerWidth / containerHeight;

    let displayWidth, displayHeight, offsetX, offsetY;

    if (containerAspect > videoAspect) {
      // Letterboxing on sides (video is taller relative to container)
      displayHeight = containerHeight;
      displayWidth = videoAspect * displayHeight;
      offsetX = (containerWidth - displayWidth) / 2;
      offsetY = 0;
    } else {
      // Letterboxing top/bottom (video is wider relative to container)
      displayWidth = containerWidth;
      displayHeight = displayWidth / videoAspect;
      offsetX = 0;
      offsetY = (containerHeight - displayHeight) / 2;
    }

    return {
      width: displayWidth,
      height: displayHeight,
      offsetX,
      offsetY,
      videoWidth,
      videoHeight,
    };
  }, [videoRef, dimensions]);

  // Update dimensions and calculate accurate scaling
  useEffect(() => {
    const updateDimensions = () => {
      if (videoRef.current) {
        const rect = videoRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width,
          height: rect.height,
          left: rect.left,
          top: rect.top,
        });

        // Update scaling reference immediately
        const displayRect = getDisplayedVideoRect();
        if (displayRect.width && displayRect.height) {
          displayScaleRef.current = {
            scaleX: displayRect.width / displayRect.videoWidth,
            scaleY: displayRect.height / displayRect.videoHeight,
            offsetX: displayRect.offsetX,
            offsetY: displayRect.offsetY,
          };
        }
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    const interval = setInterval(updateDimensions, 1000);

    return () => {
      window.removeEventListener("resize", updateDimensions);
      clearInterval(interval);
    };
  }, [videoRef, stream, getDisplayedVideoRect]);

  // Calculate the visual box based on margins
  const getBoxStyle = () => {
    if (!dimensions.width || !dimensions.height || !videoRef.current)
      return { display: "none" };

    const { scaleX, scaleY, offsetX, offsetY } = displayScaleRef.current;
    const video = videoRef.current;
    const videoWidth = video.videoWidth || 1280;
    const videoHeight = video.videoHeight || 720;

    // Apply scaling and offset to source margins
    const top = cropMargins.top * scaleY + offsetY;
    const left = cropMargins.left * scaleX + offsetX;

    // CRITICAL FIX: Calculate cropped dimensions directly from source video dimensions
    // Cropped width/height in source pixels = video dimensions - margins
    // Then scale to displayed pixels to match the overlay visualization
    const croppedWidth = videoWidth - cropMargins.left - cropMargins.right;
    const croppedHeight = videoHeight - cropMargins.top - cropMargins.bottom;
    const width = Math.max(0, croppedWidth * scaleX);
    const height = Math.max(0, croppedHeight * scaleY);

    return {
      position: "absolute",
      top: `${top}px`,
      left: `${left}px`,
      width: `${width}px`,
      height: `${height}px`,
      border: "2px solid #00ff00",
      boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
      pointerEvents: "auto",
      cursor: "move",
    };
  };

  const handleMouseDown = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    isDragging.current = type;

    // Update scaling reference at interaction start for consistency
    const displayRect = getDisplayedVideoRect();
    if (displayRect.width && displayRect.height) {
      displayScaleRef.current = {
        scaleX: displayRect.width / displayRect.videoWidth,
        scaleY: displayRect.height / displayRect.videoHeight,
        offsetX: displayRect.offsetX,
        offsetY: displayRect.offsetY,
      };
    }

    // CRITICAL FIX: Store coordinates relative to DISPLAYED VIDEO AREA (not container)
    // Must subtract letterboxing offsets to match coordinate space used in getBoxStyle()
    // Note: We don't clamp here because handles may be slightly outside displayed video area
    const { offsetX, offsetY } = displayScaleRef.current;
    const containerX = e.clientX - dimensions.left;
    const containerY = e.clientY - dimensions.top;

    // Convert to displayed video coordinates (don't clamp to allow accurate delta calculation)
    startPos.current = {
      x: containerX - offsetX,
      y: containerY - offsetY,
    };
    startMargins.current = { ...cropMargins };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging.current || !startMargins.current || !videoRef.current)
        return;

      const { scaleX, scaleY, offsetX, offsetY } = displayScaleRef.current;
      const video = videoRef.current;
      const videoWidth = video.videoWidth || 1280;
      const videoHeight = video.videoHeight || 720;

      // CRITICAL FIX: Calculate mouse position relative to DISPLAYED VIDEO AREA (not container)
      // Must subtract letterboxing offsets to match coordinate space used in getBoxStyle()
      // CRITICAL: Do NOT clamp here - must match handleMouseDown coordinate space exactly
      // Clamping would cause TOP edge to calculate wrong dy when dragging near boundaries
      const containerX = e.clientX - dimensions.left;
      const containerY = e.clientY - dimensions.top;

      // Convert to displayed video coordinates WITHOUT clamping to match startPos calculation
      // This ensures dy calculation is accurate for both TOP and BOTTOM edges
      const currentX = containerX - offsetX;
      const currentY = containerY - offsetY;

      // Convert mouse delta from displayed video pixels to source video pixels
      // Both current and start positions are in the SAME coordinate space (displayed video, no clamping)
      const dx = (currentX - startPos.current.x) / scaleX;
      const dy = (currentY - startPos.current.y) / scaleY;

      let newMargins = { ...startMargins.current };

      if (isDragging.current === "move") {
        // Move the whole box
        const currentWidth = videoWidth - newMargins.left - newMargins.right;
        const currentHeight = videoHeight - newMargins.top - newMargins.bottom;

        // Tentative new positions
        let newLeft = newMargins.left + dx;
        let newTop = newMargins.top + dy;
        let newRight = videoWidth - newLeft - currentWidth;
        let newBottom = videoHeight - newTop - currentHeight;

        // Constrain
        if (newLeft < 0) {
          newRight += newLeft;
          newLeft = 0;
        }
        if (newTop < 0) {
          newBottom += newTop;
          newTop = 0;
        }
        if (newRight < 0) {
          newLeft += newRight;
          newRight = 0;
        }
        if (newBottom < 0) {
          newTop += newBottom;
          newBottom = 0;
        }

        newMargins = {
          top: Math.max(0, newTop),
          bottom: Math.max(0, newBottom),
          left: Math.max(0, newLeft),
          right: Math.max(0, newRight),
        };
      } else {
        // Resize specific edges
        if (isDragging.current.includes("n")) {
          // Dragging north (top) edge
          const maxTop = videoHeight - startMargins.current.bottom - 1;
          const newTop = startMargins.current.top + dy;
          newMargins.top = Math.max(0, Math.min(maxTop, newTop));

          // CRITICAL: Keep bottom margin CONSTANT when dragging top edge
          newMargins.bottom = startMargins.current.bottom;
        }
        if (isDragging.current.includes("s")) {
          // Dragging south (bottom) edge - decrease bottom margin when dragging down (positive dy)
          const maxBottom = videoHeight - newMargins.top - 1;
          newMargins.bottom = Math.max(
            0,
            Math.min(maxBottom, startMargins.current.bottom - dy)
          );
        }
        if (isDragging.current.includes("w")) {
          // Dragging west (left) edge - increase left margin when dragging left (negative dx)
          const maxLeft = videoWidth - newMargins.right - 1;
          newMargins.left = Math.max(
            0,
            Math.min(maxLeft, startMargins.current.left + dx)
          );
        }
        if (isDragging.current.includes("e")) {
          // Dragging east (right) edge - decrease right margin when dragging right (positive dx)
          const maxRight = videoWidth - newMargins.left - 1;
          newMargins.right = Math.max(
            0,
            Math.min(maxRight, startMargins.current.right - dx)
          );
        }
      }

      // Ensure margins are stored as exact source-pixel integers
      newMargins.top = Math.round(newMargins.top);
      newMargins.bottom = Math.round(newMargins.bottom);
      newMargins.left = Math.round(newMargins.left);
      newMargins.right = Math.round(newMargins.right);

      onUpdateMargins(newMargins);
    },
    [dimensions, cropMargins, onUpdateMargins, getDisplayedVideoRect]
  );

  const handleMouseUp = () => {
    isDragging.current = null;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  // Handles
  const handleStyle = {
    position: "absolute",
    width: "20px",
    height: "20px",
    backgroundColor: "#00ff00",
    borderRadius: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 10,
  };

  return (
    <div
      ref={overlayRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      <div
        style={getBoxStyle()}
        onMouseDown={(e) => handleMouseDown(e, "move")}
      >
        {/* Corners */}
        <div
          style={{ ...handleStyle, top: "0%", left: "0%", cursor: "nw-resize" }}
          onMouseDown={(e) => handleMouseDown(e, "nw")}
        />
        <div
          style={{
            ...handleStyle,
            top: "0%",
            left: "100%",
            cursor: "ne-resize",
          }}
          onMouseDown={(e) => handleMouseDown(e, "ne")}
        />
        <div
          style={{
            ...handleStyle,
            top: "100%",
            left: "100%",
            cursor: "se-resize",
          }}
          onMouseDown={(e) => handleMouseDown(e, "se")}
        />
        <div
          style={{
            ...handleStyle,
            top: "100%",
            left: "0%",
            cursor: "sw-resize",
          }}
          onMouseDown={(e) => handleMouseDown(e, "sw")}
        />

        {/* Edges (invisible hit areas) */}
        <div
          style={{
            position: "absolute",
            top: "-5px",
            left: "10px",
            right: "10px",
            height: "10px",
            cursor: "n-resize",
          }}
          onMouseDown={(e) => handleMouseDown(e, "n")}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-5px",
            left: "10px",
            right: "10px",
            height: "10px",
            cursor: "s-resize",
          }}
          onMouseDown={(e) => handleMouseDown(e, "s")}
        />
        <div
          style={{
            position: "absolute",
            left: "-5px",
            top: "10px",
            bottom: "10px",
            width: "10px",
            cursor: "w-resize",
          }}
          onMouseDown={(e) => handleMouseDown(e, "w")}
        />
        <div
          style={{
            position: "absolute",
            right: "-5px",
            top: "10px",
            bottom: "10px",
            width: "10px",
            cursor: "e-resize",
          }}
          onMouseDown={(e) => handleMouseDown(e, "e")}
        />

        {/* Dimensions Label & Save Button */}
        <div
          style={{
            position: "absolute",
            top: "-40px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: "10px",
            pointerEvents: "auto",
          }}
        >
          <div
            style={{
              background: "rgba(0,0,0,0.7)",
              color: "white",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "12px",
              whiteSpace: "nowrap",
            }}
          >
            Adjust Crop
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSave();
            }}
            style={{
              background: "#00ff00",
              color: "black",
              border: "none",
              padding: "4px 12px",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: "bold",
              cursor: "pointer",
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
