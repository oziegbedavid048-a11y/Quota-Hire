import React from 'react';
import { CVData } from '../../../../lib/cv/types';
import { PlainTemplateBase } from './PlainTemplateBase';

export const PlainTemplate4 = ({ data }: { data: CVData }) => (
  <PlainTemplateBase 
    data={data} 
    theme={{
      primary: '#333333',
      headerAlign: 'left',
      showDividers: false,
      fontFamily: 'Helvetica'
    }} 
  />
);
