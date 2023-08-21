import React from 'react';

const SvgItem = ({ cellContent, phCellMapping, phCellUsage }) => {

  return (
    <svg width="100%" height={`${(maxRow*70).toString(10)}px`}>
      {Array.from({ length: maxRow }, (_, rowIndex) => (
        Array.from({ length: 16 }, (_, colIndex) => {
          const x = (colIndex + 1) * 40; // Adjust the box width and spacing as needed
          const y = (rowIndex + 1) * 60 - 35; // Adjust the box height and spacing as needed
          const colLabel = `${colIndex.toString(16)}`;
          const rowLabel = `${rowIndex.toString(16)}`;
          const cellContentLabel = ("00" + cellContent[rowIndex][colIndex].toString(16).toUpperCase()).substr(-2);
          const phCellMappingLabel = ("00" + phCellMapping[rowIndex][colIndex].toString(16).toUpperCase()).substr(-2);
          const phCellRow = Math.floor(phCellMapping[rowIndex][colIndex]/16);
          const phCellColumn = phCellMapping[rowIndex][colIndex]%16;
          const phCellUsageLabel = ("00" + phCellUsage[phCellRow][phCellColumn].toString(16).toUpperCase()).substr(-2);
          const allZeros = (cellContentLabel==="00");

          return (
            <>
            <g key={`${rowIndex}-${colIndex}-${cellContentLabel}`}>
              // Cell content box
              <rect x={x} y={y} width="40" height="40" fill={(allZeros?"#000000":"#4f4f4f")} stroke="#000000" />
              // Cell content
              <text x={x + 20} y={y + 25} textAnchor="middle" fill="#00ff00" fontSize="18" fontFamily="monospace" fontWeight={(allZeros?"normal":"bold")}>
                {cellContentLabel}
              </text>
              // Physical address box 
              <rect x={x} y={y+40} width="20" height="20" fill="#fc8464" />
              <text x={x + 2} y={y + 55} textAnchor="left" fontWeight="bold" fill="black" fontSize="12">
                {phCellMappingLabel}
              </text>
              // Usage box
              <rect x={x + 20} y={y+40} width="20" height="20" fill="#5a94a8" />
              <text x={x + 22} y={y + 55} textAnchor="right" fontSize="12" fontWeight="bold" fill="white">
                {phCellUsageLabel}
              </text>
            </g>
            ((colIndex === 0) ? (
              <text x={20} y={y + 25} fill="white" textAnchor="middle" fontSize="12">
                {rowLabel}
              </text>
            ) : "");
            ((rowIndex === 0) ? (
              <text x={x + 20} y={10} fill="white" textAnchor="middle" fontSize="12">
                {colLabel}
              </text>
            ) : "");
            </>
          );
        })
      ))}
    </svg>
  );
};

export default SvgItem;

