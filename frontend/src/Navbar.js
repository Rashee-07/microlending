import React from "react";
import { useState } from "react";
import DropdownMenu from "./DropdownMenu";

function Navbar(props) {
  const BankNav = [
    { NavItem: ["About", "Accounts", "Deposits"], name: "Home",Action:"isHome",},
    { NavItem: ["News", "Success story", "Video Gallery"], name: "Media" ,Action:"isMedia"},
    { NavItem: ["Hyderabad", "Bangalore", "Chennai"], name: "Branches",Action:"isBranches"},
    { NavItem: ["openings", "New opportunites"], name: "Careers",Action:"isCareers",},
    { NavItem: ["Policies", "Downloads"], name: "Regulations",Action:"isRegulations", },
    { NavItem: ["About Vitas", "Leadership Team"], name: "About" ,Action:"isAbout",},
    { NavItem: ["Raise Ticket", "Help"], name: "Complaints",Action:"isComplaints", },
    { NavItem: ["HR@aaseya.com", "7033345671"], name: "ContactUs",Action:"isContactUs" },
  ];
  const [initPosition, setPosition] = useState({
    isHome: false,
    isMedia: false,
    isBranches: false,
    isCareers: false,
    isRegulations: false,
    isAbout: false,
    isComplaints: false,
    isContactUs:false
  });
  const handleMouseEnter = (setAction,value) => {
    setAction({...initPosition,[value]:true});
   
  };

  const handleMouseLeave = (setAction,value) => {
    setAction({...initPosition,[value]:false});
  };
  
  return (
    <div className="Nav">
  {BankNav.map((item)=>{
    return(
      <div
          onMouseEnter={() => handleMouseEnter(setPosition,item.Action)}
          onMouseLeave={() => handleMouseLeave(setPosition,item.Action)}
        >
          <div className="who">{item.name}</div>
          {initPosition[`${item.Action}`] && <DropdownMenu items={item.NavItem} />}
        </div>
    )
  })}
  </div>
  );

}
export default Navbar;
