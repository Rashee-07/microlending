import React from "react";

const DropdownMenu = ({items}) => {
    
  return (
    <div className="dropdown-menu">
    <div className="submenu">
      {items.map((ele)=> <div className="item">{ele}</div>)}
    </div> 
   </div>
  );
};

export default DropdownMenu;