import React from 'react';

const ShortcutsHelp = ({ cameraError, hasNextStudent }) => {
    return (
        <div className="shortcuts-help">
            <span>
                {cameraError
                    ? "Camera unavailable. Please ensure camera permissions are granted."
                    : `Shortcuts: Enter=Capture/Keep & Next, R=Retake, K/F=Finish & Save, A=Keep & Next${hasNextStudent ? ", N=Next Student" : ""
                    }, Esc=Close`}
            </span>
        </div>
    );
};

export default React.memo(ShortcutsHelp);
