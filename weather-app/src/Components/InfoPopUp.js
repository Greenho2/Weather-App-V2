import React from "react";
import './InfoPopUp.css';

//Pop up box for information regarding PM Accelerator


function InfoPopUp({isOpen, onClose}){
    if (!isOpen) return null;

    return(
        <div className='Overlay'>
            <div className= 'Content'>

                <button className="Close" onClick={onClose}>X</button>

                <h2> About PM Accelerator</h2>

                <p>The Product Manager Accelerator is a program designed to support Project Managers through every stage in their careers.
                    It consists of a free Youtube course along with different paid classes depending on your needs.
                    Click on the link below to learn more:
                </p>
                
                <a href='https://www.linkedin.com/school/productmanagerinterview/?trk=public_profile_topcard-current-company'target="_blank" rel="noopener noreferrer">
                    LinkedIn Product Manager Accelerator</a>
            </div>
        </div>
    )
}

export default InfoPopUp;