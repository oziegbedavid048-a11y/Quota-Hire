import React from 'react';
import { CVData } from '../../../../lib/cv/types';
import { PlainTemplateBase } from './PlainTemplateBase';

export const PlainTemplate7 = ({ data }: { data: CVData }) => (
  <PlainTemplateBase 
    data={data} 
    theme={{
      primary: '#2C3E50',
      headerAlign: 'center',
      showDividers: true,
      fontFamily: 'Helvetica'
    }} 
  />
);
