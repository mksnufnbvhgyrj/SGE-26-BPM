const fs = require('fs');

const appFile = 'src/App.tsx';
let content = fs.readFileSync(appFile, 'utf8');

const regex = /\{\/\* Toolbar \/ Filtros \(Ficha Individual\) \*\/\}(.|\n)*\{activeAdminTab === 'configuracoes' && \(/gm;

const replacement = `{activeAdminTab === 'ficha_individual' && (
      <FichaIndividualPanel 
        members={members}
        selectedFichaMemberId={selectedFichaMemberId}
        setSelectedFichaMemberId={setSelectedFichaMemberId}
        filteredFichaMembers={filteredFichaMembers}
        fichaSearch={fichaSearch}
        setFichaSearch={setFichaSearch}
        activeFichaSection={activeFichaSection}
        setActiveFichaSection={setActiveFichaSection}
        fichaFormData={fichaFormData}
        setFichaFormData={setFichaFormData}
        handleSaveFicha={handleSaveFicha}
        handlePhotoUpload={handlePhotoUpload}
        processAnexoFiles={processAnexoFiles}
        handleRemoveAnexo={handleRemoveAnexo}
        setActiveAdminTab={setActiveAdminTab}
      />
    )}

    {activeAdminTab === 'configuracoes' && (`

const newContent = content.replace(regex, replacement);
fs.writeFileSync(appFile, newContent);
console.log('App updated');
