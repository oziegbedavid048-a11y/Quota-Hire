import React from 'react';
import { CVData } from '../../../../lib/cv/types';
import { PlainTemplateBase } from './PlainTemplateBase';

export const PlainTemplate3 = ({ data }: { data: CVData }) => (
  <PlainTemplateBase 
    data={data} 
    theme={{
      primary: '#2D5016',
      headerAlign: 'center',
      showDividers: false,
      fontFamily: 'Helvetica'
    }} 
  />
);
