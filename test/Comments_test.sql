/* Dette script demonstrerer en kompleks forespørgsel med JOINs, CASE, COALESCE og WINDOW FUNCTIONS */

SELECT 
    wf.CASEID,                                -- Unik ID for workflow-case
    wf.DOCUMENT,                              -- Dokumentnavn eller reference
    COALESCE(wf.STEP_NAME, wf.WORKFLOW_GROUP) AS ACTION,  -- Navn på trin eller gruppe
    wf.TRACKINGMESSAGE,                       -- Besked knyttet til sporing
    usr.NAME AS RESOURCE,                     -- Navn på den ansvarlige ressource
    inv.INVOICEID,                            -- Faktura-ID
    inv.PURCHNAME,                            -- Indkøbsnavn
    COALESCE(usr.DEPARTMENTNAME, inv.DEPARTMENTNAME) AS DEPARTMENTNAME, -- Afdelingsnavn
    inv.DEPARTMENTNUMBER,                     -- Afdelingsnummer
    inv.INVOICEACCOUNT,                       -- Fakturakonto
    inv.DUEDATE,                              -- Forfaldsdato
    CAST(inv.INVOICEAMOUNT AS money) AS CASE_SUM, -- Fakturabeløb
    DATEADD(MILLISECOND, wf.CASE_SEQUENCE * 10, wf.CREATEDDATETIME) AS EVENT_START, -- Starttidspunkt for hændelse
    CAST(MAX(wf.CREATEDDATETIME) OVER (
        PARTITION BY wf.CASEID, wf.ELEMENTID, wf.TRACKINGCONTEXT 
        ORDER BY wf.CREATEDDATETIME DESC
    ) AS DATETIME2(3)) AS EVENT_END,          -- Seneste tidspunkt for hændelse
    wf.CASE_SEQUENCE,                         -- Sekvensnummer
    wf.STEP_NAME,                             -- Navn på workflow-trin
    -- Gruppér efter type baseret på trackingtype og tilstedeværelse af bruger
    CASE
        WHEN wf.TRACKINGTYPE = 36 THEN 'Automatik'
        WHEN wf.TRACKINGTYPE IN (10, 4) THEN 'Person'
        WHEN usr.NAME IS NOT NULL THEN 'Person'
        ELSE 'System'
    END AS GROUPING,

    wf.FAULT_MESSAGE,                         -- Fejlmeddelelse
    COALESCE(dep.Org, dep2.Org) AS ORGANIZATIONPATH,     -- Organisationssti
    COALESCE(top.OrgTop, top2.OrgTop) AS ORGANIZATIONROOT -- Øverste organisatoriske niveau
FROM #WORKFLOW AS wf
INNER JOIN #INVOICES AS inv
    ON inv.RECID = wf.CONTEXTRECID
LEFT JOIN #USERINFO AS usr
    ON wf.USER_ = usr.USER_
-- Alternativ join til brugerinfo (deaktiveret)
-- LEFT JOIN dbo.userinfo AS usr ON wf.USER_ = usr.ID
LEFT JOIN #FindTheDepartment AS dep
    ON usr.DEPARTMENTNAME = dep.Name
LEFT JOIN #FindTheDepartment AS dep2
    ON inv.DEPARTMENTNAME = dep2.Name
LEFT JOIN #TopOrg AS top
    ON usr.DEPARTMENTNAME = top.Name
LEFT JOIN #TopOrg AS top2
    ON inv.DEPARTMENTNAME = top2.Name
WHERE 
    wf.STEP_NAME <> 'Completion' 
    AND wf.WORKFLOW_GROUP <> 'Approval'

/* Slut på forespørgslen */