import React from 'react';
import { ReactCompareSlider, ReactCompareSliderImage, ReactCompareSliderHandle } from 'react-compare-slider';
import './ImageComparison.css';

/**
 * Reusable Image Comparison Component
 * Uses react-compare-slider for before/after image comparison
 * 
 * @param {string} beforeImage - URL/path of the "before" image
 * @param {string} afterImage - URL/path of the "after" image
 * @param {string} beforeLabel - Label for the before image (default: 'Before')
 * @param {string} afterLabel - Label for the after image (default: 'After')
 * @param {string} aspectRatio - CSS aspect ratio (e.g., '16/9', '4/3')
 * @param {string} className - Additional CSS classes
 * @param {number} position - Initial slider position (0-100, default: 50)
 * @param {boolean} portrait - Vertical comparison mode (default: false)
 * @param {boolean} showLabels - Show before/after labels (default: true)
 * @param {string} handleColor - Color of the slider handle (default: '#ffffff')
 */
const ImageComparison = ({
  beforeImage,
  afterImage,
  beforeLabel = 'Before',
  afterLabel = 'After',
  aspectRatio,
  className = '',
  position = 50,
  portrait = false,
  showLabels = true,
  handleColor = '#ffffff',
  ...props
}) => {
  if (!beforeImage || !afterImage) {
    return null;
  }

  const CustomHandle = () => (
    <ReactCompareSliderHandle
      buttonStyle={{
        backdropFilter: 'blur(4px)',
        background: handleColor,
        border: 0,
        color: '#333',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.3)',
      }}
      linesStyle={{
        opacity: 0.8,
        background: handleColor,
      }}
    />
  );

  return (
    <div className={`image-comparison-wrapper ${className}`}>
      <ReactCompareSlider
        itemOne={
          <ReactCompareSliderImage
            src={beforeImage}
            alt={beforeLabel}
            style={{ objectFit: 'contain' }}
          />
        }
        itemTwo={
          <ReactCompareSliderImage
            src={afterImage}
            alt={afterLabel}
            style={{ objectFit: 'contain' }}
          />
        }
        handle={<CustomHandle />}
        position={position}
        portrait={portrait}
        style={aspectRatio ? { aspectRatio } : undefined}
        className="comparison-slider"
        {...props}
      />
      {showLabels && (
        <div className={`comparison-labels ${portrait ? 'portrait' : ''}`}>
          <span className="label-before">{beforeLabel}</span>
          <span className="label-after">{afterLabel}</span>
        </div>
      )}
    </div>
  );
};

export default ImageComparison;

